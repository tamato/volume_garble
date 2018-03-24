#version 430

layout(location=0) in vec2 TexCoords;

uniform sampler3D Volume;
uniform vec3 volumeRes = vec3(64);

layout(location=0) out vec4 FragColor;

vec4 getSample(in vec2 pos) {
    vec4 result = vec4(0);
    for (int d=0; d<volumeRes.z; ++d) {
        float w = d / volumeRes.z;
        float v = texture(Volume, vec3(pos, w)).r;
        if (v > 0) result = vec4(pos, w, v);
    }

    return result;
}

void main() {
    FragColor = getSample( TexCoords );
}
