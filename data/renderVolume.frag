#version 430

layout(location=0) in vec2 TexCoords;

uniform sampler3D Volume;
uniform vec3 VolumeRes = vec3(64);
uniform vec2 FrameRes = vec2(512);

layout(location=0) out vec4 FragColor;

vec4 getSampleNormal(in vec3 pos) {
    vec4 result = vec4(0);
    for (int d=int(pos.z * VolumeRes.z); d<VolumeRes.z; ++d) {
        float w = d / VolumeRes.z;
        vec4 v = texture(Volume, vec3(pos.xy, w));
        if (v.a > 0) result = v;
    }

    return result;
}

vec4 getSample(in vec3 pos) {
    vec4 result = vec4(0);
    for (int d=int(pos.z * VolumeRes.z); d<VolumeRes.z; ++d) {
        float w = d / VolumeRes.z;
        float v = texture(Volume, vec3(pos.xy, w)).a;
        if (v > 0) result = vec4(pos.xy, w, v);
    }

    return result;
}

vec4 getSampledFd(in vec3 pos) {
    vec4 value = getSample(pos);
    value.xyz = normalize(value.xyz);

    vec4 x_value = dFdx(value);
    vec4 y_value = dFdy(value);

    value.xyz = cross( y_value.xyz, x_value.xyz );
    return value;
}

vec4 getSample3(in vec3 pos) {

    vec3 offset = vec3(1. / FrameRes, 0);
    vec4 x_value = getSample( pos + offset.xzz);
    vec4 y_value = getSample( pos + offset.yzz);

    // cross the rays that found something
    vec4 value = getSample(pos);
    value.xyz = cross( y_value.xyz, x_value.xyz );
    return value;
}

vec4 getSample4(in vec3 pos) {

    const vec2 invRes = 1. / FrameRes;
    // const vec2 invRes = 1. / VolumeRes.xy;
    vec3 offset = vec3(invRes.x, -invRes.x, 0);

    vec3 xyy = offset.xyy * getSample( pos + offset.xyy ).w;
    vec3 yxy = offset.yxy * getSample( pos + offset.yxy ).w;
    vec3 yyx = offset.yyx * getSample( pos + offset.yyx ).w;
    vec3 xxx = offset.xxx * getSample( pos + offset.xxx ).w;

    vec4 value = vec4( normalize( xyy + yxy + yyx + xxx ), 1);
    return value;
/*
    vec2 e = vec2(1.0,-1.0)*0.5773*0.0005;
    return normalize( e.xyy*map( pos + e.xyy ).x + 
                      e.yyx*map( pos + e.yyx ).x + 
                      e.yxy*map( pos + e.yxy ).x + 
                      e.xxx*map( pos + e.xxx ).x );
*/
}

vec4 getSample5(in vec3 pos) {
    vec4 value = getSampleNormal(pos);
    return value;
}

vec4 getSample6(in vec3 pos) {
    const vec2 invRes = 1. / FrameRes;
    // const vec2 invRes = 1. / VolumeRes.xy;
    vec3 offset = vec3(invRes.x, 0, 0);

    vec4 value = vec4(
        getSample(pos + offset.xyy).w - getSample(pos-offset.xyy).w,
        getSample(pos + offset.yxy).w - getSample(pos-offset.yxy).w,
        getSample(pos + offset.yyx).w - getSample(pos-offset.yyx).w,
        1);
    return value;
/*
    vec3 eps = vec3( 0.0005, 0.0, 0.0 );
    vec3 nor = vec3(
        map(pos+eps.xyy).x - map(pos-eps.xyy).x,
        map(pos+eps.yxy).x - map(pos-eps.yxy).x,
        map(pos+eps.yyx).x - map(pos-eps.yyx).x );
*/
}

void main() {
    // include this here just so that no errors are thrown if the use "getSample*"
    //  is not using FrameRes
    const vec2 invRes = FrameRes * vec2(0.0000001);
    vec2 offset = vec2(invRes.x, -invRes.x);

    vec4 value = vec4(0);
    // value = getSample( vec3(TexCoords, 0) );
    // value = getSampledFd( vec3(TexCoords, 0) );
    // value = getSample3( vec3(TexCoords, 0) );
    // value = getSample4( vec3(TexCoords, 0) );
    // value = getSample5( vec3(TexCoords, 0) );
    value = getSample6( vec3(TexCoords, 0) );

    vec3 normal = normalize(value.xyz);
    normal = abs(normal);
    float alpha = length(normal);

    FragColor = vec4(normal, alpha + offset.x);
}
