// =====================================================================
//  CRYSTAL TUNNEL v2 — post (Image pass). iChannel0 = Buffer A (mipmap filter, clamp).
//  rgb = HDR, a = CoC. Depth of field (gather), volumetric light shafts from the core,
//  strong HDR bloom pyramid, chromatic aberration, ACES filmic, vignette, periodic grain.
// =====================================================================
#define LOOP_T 40.0
vec3 ACESFilm(vec3 x){ x *= 0.62; return clamp((x*(2.51*x + 0.03)) / (x*(2.43*x + 0.59) + 0.14), 0.0, 1.0); }
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec3 blurLod(vec2 uv, float lod){
    vec2 px = exp2(lod) / iResolution.xy;
    vec3 c = vec3(0); float ws = 0.;
    for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++){
        vec2 o = vec2(i, j); float w = exp(-dot(o, o) * 0.35);
        c += textureLod(iChannel0, uv + o * px * 0.85, lod).rgb * w; ws += w;
    }
    return c / ws;
}
vec3 dof(vec2 uv){
    vec4 c0 = textureLod(iChannel0, uv, 0.0);
    float rad = c0.a * iResolution.y;                     // CoC radius in pixels
    if (rad < 0.6) return c0.rgb;
    vec3 acc = c0.rgb; float ws = 1.0;
    const float GA = 2.39996323;
    float lod = clamp(log2(rad / 5.0), 0.0, 2.0);
    for (int i = 1; i < 28; i++){
        float fi = float(i);
        float rr = sqrt(fi / 27.0) * rad;
        vec2 o = vec2(cos(fi * GA), sin(fi * GA)) * rr / iResolution.xy;
        vec4 s = textureLod(iChannel0, uv + o, lod);
        float w = smoothstep(rr - 1.5, rr + 1.5, s.a * iResolution.y + 1.0);   // scatter-as-gather
        acc += s.rgb * w; ws += w;
    }
    return acc / ws;
}
vec3 shafts(vec2 uv){
    vec2 c = vec2(0.5);
    vec2 d = (c - uv) / 56.0 * 0.92;
    vec2 q = uv; vec3 acc = vec3(0); float dec = 1.0;
    float j = hash13(vec3(gl_FragCoord.xy, 3.0));
    q += d * j;
    for (int i = 0; i < 56; i++){
        q += d;
        vec3 s = textureLod(iChannel0, q, 3.0).rgb;
        acc += max(s - 0.9, 0.0) * dec;
        dec *= 0.962;
    }
    return acc / 56.0;
}
void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord / iResolution.xy;
    vec2 cc = uv - 0.5;
    vec2 ca2 = cc * vec2(iResolution.x / iResolution.y, 1.0);
    float r2 = dot(ca2, ca2);
    vec3 col = dof(uv);
    float ca = 0.0035 * r2;                               // radial chromatic aberration
    col.r = mix(col.r, dof(0.5 + cc * (1.0 + ca)).r, 0.85);
    col.b = mix(col.b, dof(0.5 + cc * (1.0 - ca)).b, 0.85);
    vec3 b = vec3(0);
    b += blurLod(uv, 1.0) * 0.26; b += blurLod(uv, 2.0) * 0.24; b += blurLod(uv, 3.0) * 0.22;
    b += blurLod(uv, 4.0) * 0.20; b += blurLod(uv, 5.0) * 0.20; b += blurLod(uv, 6.0) * 0.18;
    b += blurLod(uv, 7.0) * 0.16;
    col += max(b - 0.18, 0.0) * 0.16;
    col += shafts(uv) * vec3(0.55, 0.85, 1.25) * 1.6;
    col *= mix(1.0, smoothstep(1.25, 0.20, r2 * 1.1), 0.6);
    col = ACESFilm(col);
    col = pow(col, vec3(1.0 / 2.2));
#ifndef NOGRAIN
    float fr = floor(mod(iTime, LOOP_T) * 60.0 + 0.5);
    float g = hash13(vec3(fragCoord, fr)) + hash13(vec3(fragCoord + 37.0, fr + 11.0)) - 1.0;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col += g * (0.018 * (1.0 - lum) * lum * 2.0 + 1.0 / 255.0);
#endif
    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
