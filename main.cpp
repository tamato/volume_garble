#include <iostream>
#include <algorithm>
#include <iomanip>
#include <sstream>

#include <glad/glad.h>

#include <GLFW/glfw3.h>

#define GLM_ENABLE_EXPERIMENTAL

#include "glm/glm.hpp"
#include "glm/gtc/matrix_transform.hpp"
#include "glm/gtx/string_cast.hpp"
#include "glm/gtx/rotate_vector.hpp"

#include "common/debug.h"
#include "common/programobject.h"
#include "common/objloader.h"
#include "common/meshbuffer.h"
#include "common/meshobject.h"
#include "common/renderable.h"

using namespace std;
using namespace ogle;

std::string DataDirectory; // ends with a forward slash
int WINDOW_WIDTH = 1024;
int WINDOW_HEIGHT = 1024;
GLFWwindow* glfwWindow;

const int LayersCount = 32;

GLuint Volume = 0;
MeshObject Quad;

ProgramObject ClearVolumeShader;
ProgramObject FillVolumeShader;
ProgramObject RenderVolumeShader;

void errorCallback(int error, const char* description)
{
    cerr << description << endl;
}

void keyCallback(GLFWwindow* window, int key, int scancode, int action, int mods)
{
    if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS)
        glfwSetWindowShouldClose(window, GL_TRUE);
}

void initGLFW(){
    if (!glfwInit())
    {
        fprintf(stderr, "Failed to initialize GLFW\n");
        exit(EXIT_FAILURE);
    }

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_OPENGL_DEBUG_CONTEXT, GL_TRUE);

    glfwWindow = glfwCreateWindow(WINDOW_WIDTH, WINDOW_HEIGHT, "OIT", NULL, NULL);
    if (!glfwWindow)
    {
        fprintf(stderr, "Failed to create GLFW glfwWindow\n");
        glfwTerminate();
        exit(EXIT_FAILURE);
    } 

    glfwMakeContextCurrent(glfwWindow);
    glfwSwapInterval( 0 ); // Turn off vsync for benchmarking.

    glfwSetTime( 0.0 );
    glfwSetKeyCallback(glfwWindow, keyCallback);
    glfwSetErrorCallback(errorCallback);
}

void initGLAD(){
/*
    if (glewInit() != GLEW_OK)
    {
        std::cout << "initGlew!!: Failed to load opengl functions" << std::endl;
        exit(EXIT_FAILURE);
    }*/

    if (!gladLoadGLLoader((GLADloadproc) glfwGetProcAddress))
    {
        std::cout << "initGLAD: Failed to initialize OpenGL context" << std::endl;
        exit(EXIT_FAILURE);
    }

    int width,height;
    glfwGetFramebufferSize(glfwWindow, &width, &height);
    glViewport( 0, 0, (GLsizei)width, (GLsizei)height );    
}

void setDataDir(int argc, char *argv[]){
    // get base directory for reading in files
	DataDirectory = "../volume/data/";
}

void createTextures() {
    glGenTextures(1, &Volume);
    glBindTexture(GL_TEXTURE_3D, Volume);
    glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexStorage3D(GL_TEXTURE_3D, 3, GL_RGBA32F, LayersCount, LayersCount, LayersCount);
    // glGenerateMipmap(GL_TEXTURE_3D);
    glBindTexture(GL_TEXTURE_3D, 0);

    glBindImageTexture(1, Volume, 0, GL_TRUE, 0, GL_READ_WRITE, GL_RGBA32F);
}

void initQuad() {

    std::vector<glm::vec3> positions = {
        glm::vec3(-1, -1, -1),  
        glm::vec3( 1, -1, -1),  
        glm::vec3( 1,  1, -1),  
        glm::vec3(-1,  1, -1),  
    };
    std::vector<glm::vec2> texs = {
        glm::vec2(0, 0),
        glm::vec2(1, 0),
        glm::vec2(1, 1),
        glm::vec2(0, 1),
    };

    std::vector<uint32_t> indices = {
       0,1,2, 2,3,0 
    };

    MeshBuffer buffer;
    buffer.setVerts(4, (const float*)&positions.data()[0]);
    buffer.setTexCoords(0, 4, (const float*)&texs.data()[0]);
    buffer.setIndices(6, indices.data());
    Quad.init(buffer);

    std::map<unsigned int, std::string> shaders;
    shaders[GL_VERTEX_SHADER] = DataDirectory + "quad.vert";
    shaders[GL_FRAGMENT_SHADER] = DataDirectory + "clearVolume.frag";
    ClearVolumeShader.init(shaders);

    shaders[GL_VERTEX_SHADER] = DataDirectory + "quad.vert";
    shaders[GL_FRAGMENT_SHADER] = DataDirectory + "fillVolume.frag";
    FillVolumeShader.init(shaders);

    shaders[GL_VERTEX_SHADER] = DataDirectory + "quad.vert";
    shaders[GL_FRAGMENT_SHADER] = DataDirectory + "renderVolume.frag";
    RenderVolumeShader.init(shaders);
}

void init(int argc, char* argv[]){
    setDataDir(argc, argv);
    initGLFW();
    initGLAD();
    ogle::Debug::init();

    createTextures();
    initQuad();
}

void update(){
    static std::vector<float> deltas;
    static float sum_deltas = 0;

    float deltaTime = (float)glfwGetTime(); // get's the amount of time since last setTime
    deltas.push_back(deltaTime);
    sum_deltas += deltaTime;

    glfwSetTime(0);

    if (sum_deltas > .5f) {
        sum_deltas = 0;

        float ave = 0;
        for (auto& d: deltas){
            ave += d;
        }
        ave /= deltas.size();
        deltas.clear();

    	int fps = int(1 / ave);
    	float milliseconds = ave * 1000.f;
    	string title = "OIT - FPS (" + std::to_string(fps) + ") / " + std::to_string(milliseconds) + "ms";
        glfwSetWindowTitle(glfwWindow, title.c_str());
    }
}

void defaultRenderState() {
    glEnable(GL_BLEND);
    glBlendEquation(GL_FUNC_ADD);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LESS);
    glDepthMask(GL_TRUE);

    glEnable(GL_CULL_FACE);
    glCullFace(GL_BACK);
}

void clearVolume() {
    glm::vec3 volume_res = glm::vec3(LayersCount);
    ClearVolumeShader.bind();
    ClearVolumeShader.setInt(1, "Volume");
    ClearVolumeShader.setVec3((const float*)&volume_res, "VolumeRes");
    Quad.render();    
}

void fillVolume() {

    glm::vec3 volume_res = glm::vec3(LayersCount);
    FillVolumeShader.bind();
    FillVolumeShader.setInt(1, "Volume");
    FillVolumeShader.setVec3((const float*)&volume_res, "VolumeRes");

    glMemoryBarrier(GL_ALL_BARRIER_BITS);
    Quad.render();    
}

void renderVolume() {

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_3D, Volume);

    glm::vec3 volume_res = glm::vec3(LayersCount);
    glm::vec2 frame_res = glm::vec2(WINDOW_WIDTH, WINDOW_HEIGHT);
    RenderVolumeShader.bind();
    RenderVolumeShader.setVec3((const float*)&volume_res, "VolumeRes");
    RenderVolumeShader.setVec2((const float*)&frame_res, "FrameRes");

    Quad.render();    
    glBindTexture(GL_TEXTURE_3D, 0);
}

void render(){
    defaultRenderState();

    glViewport(0,0,LayersCount, LayersCount);
    clearVolume();
    fillVolume();

    glClearColor( 0,0,0,0 );
    glClearDepth( 1 );
    glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );
    glViewport(0,0,WINDOW_WIDTH, WINDOW_HEIGHT);
    renderVolume();
}

void runloop(){
    glfwSetTime(0); // init timer
    while (!glfwWindowShouldClose(glfwWindow)){
        glfwPollEvents();
        update();
        render();
        glfwSwapBuffers(glfwWindow);
    }
}

void shutdown(){
    ClearVolumeShader.shutdown();
    FillVolumeShader.shutdown();
    RenderVolumeShader.shutdown();
    Quad.shutdown();
    glDeleteTextures(1, &Volume);

    ogle::Debug::shutdown();
    glfwDestroyWindow(glfwWindow);
    glfwTerminate();    
}

int main(int argc, char* argv[]){
    init(argc, argv);
    runloop();
    shutdown();
    exit(EXIT_SUCCESS);
}
