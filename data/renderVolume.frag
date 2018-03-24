#version 430

layout(location=0) in vec2 TexCoords;

uniform sampler3D Volume;
uniform vec3 VolumeRes = vec3(64);
uniform vec2 FrameRes = vec2(512);

layout(location=0) out vec4 FragColor;

vec4 getSampleNormal(in vec2 pos) {
    vec4 result = vec4(0);
    for (int d=0; d<VolumeRes.z; ++d) {
        float w = d / VolumeRes.z;
        vec4 v = texture(Volume, vec3(pos, w));
        if (v.a > 0) result = v;
    }

    return result;
}

vec4 getSample(in vec2 pos) {
    vec4 result = vec4(0);
    for (int d=0; d<VolumeRes.z; ++d) {
        float w = d / VolumeRes.z;
        float v = texture(Volume, vec3(pos, w)).a;
        if (v > 0) result = vec4(pos, w, v);
    }

    return result;
}

vec4 getSampledFd(in vec2 pos) {
    vec4 value = getSample(pos);
    value.xyz = normalize(value.xyz);

    vec4 x_value = dFdx(value);
    vec4 y_value = dFdy(value);

    value.xyz = cross( y_value.xyz, x_value.xyz );
    return value;
}

vec4 getSample3(in vec2 pos) {

    vec3 offset = vec3(1. / FrameRes, 0);
    vec4 x_value = getSample( pos + offset.xz);
    vec4 y_value = getSample( pos + offset.yz);

    // cross the rays that found something
    vec4 value = getSample(pos);
    value.xyz = cross( y_value.xyz, x_value.xyz );
    return value;
}

vec4 getSample4(in vec2 pos) {

    const vec2 invRes = 1. / FrameRes;
    vec2 offset = vec2(invRes.x, -invRes.x);

    vec3 xyy = offset.xyy * getSample( pos + offset.xy ).w;
    vec3 yxy = offset.yxy * getSample( pos + offset.yx ).w;
    vec3 yyx = offset.yyx * getSample( pos + offset.yy ).w;

    vec4 value = vec4( normalize( xyy + yxy + yyx ), 1);
    return value;
}

vec4 getSample5(in vec2 pos) {
    vec4 value = getSampleNormal(pos);
    return value;
}

vec4 getSample6(in vec2 pos) {
    vec4 value = getSampleNormal(pos);
    return value;
}

/*
vec3 calcNormal( in vec3 pos )
{
    vec2 e = vec2(1.0,-1.0)*0.5773*0.0005;
    return normalize( e.xyy*map( pos + e.xyy ).x + 
                      e.yyx*map( pos + e.yyx ).x + 
                      e.yxy*map( pos + e.yxy ).x + 
                      e.xxx*map( pos + e.xxx ).x );
    vec3 eps = vec3( 0.0005, 0.0, 0.0 );
    vec3 nor = vec3(
        map(pos+eps.xyy).x - map(pos-eps.xyy).x,
        map(pos+eps.yxy).x - map(pos-eps.yxy).x,
        map(pos+eps.yyx).x - map(pos-eps.yyx).x );
    return normalize(nor);
}
*/

void main() {
    // include this here just so that no errors are thrown if the use "getSample*"
    //  is not using FrameRes
    const vec2 invRes = FrameRes * vec2(0.0000001);
    vec2 offset = vec2(invRes.x, -invRes.x);

    vec4 value = vec4(0);
    value = getSample4( TexCoords );
    // value = getSample3( TexCoords );
    // value = getSampledFd( TexCoords );
    // value = getSample( TexCoords );
    // value = getSample5( TexCoords );
    // value = getSample6( TexCoords );

    vec3 normal = normalize(value.xyz);
    normal = abs(normal);
    float alpha = length(normal);

    FragColor = vec4(normal, alpha + offset.x);
}
