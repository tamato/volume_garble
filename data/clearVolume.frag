#version 430

layout(rgba32f) uniform image3D Volume;

uniform vec3 VolumeRes = vec3(64);

void main() {
    ivec2 loc = ivec2(gl_FragCoord.xy);
    for (int d=0; d<VolumeRes.z; ++d) {
        imageStore(Volume, ivec3(loc, d), vec4(0));
    }
    discard;
}
