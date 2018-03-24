#version 430

layout(r16f) uniform image3D Volume;

uniform vec3 volumeRes = vec3(64);

void main() {
    ivec2 loc = ivec2(gl_FragCoord.xy);

    vec3 center = vec3(.5);
    float rad = 0.25;
    for (int d=0; d<volumeRes.z; ++d) {
        vec3 volume_loc = vec3(gl_FragCoord.xy, d) / volumeRes;
        float dist = length(center - volume_loc);
        if ( dist < rad) {
            imageStore(Volume, ivec3(loc, d), vec4(1));
        }
    }
    discard;
}
