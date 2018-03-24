#version 430

layout(rgba32f) uniform image3D Volume;

uniform vec3 VolumeRes = vec3(64);

void main() {
    ivec2 loc = ivec2(gl_FragCoord.xy);

    vec3 center = vec3(.5);
    float rad = 0.25;
    for (int d=0; d<VolumeRes.z; ++d) {
        vec3 volume_loc = vec3(gl_FragCoord.xy, d) / VolumeRes;
        float dist = length(center - volume_loc);
        if ( dist < rad) {
            vec3 norm = volume_loc - center;
            norm = normalize(norm);
            imageStore(Volume, ivec3(loc, d), vec4(norm, 1));
        }
    }
    discard;
}
