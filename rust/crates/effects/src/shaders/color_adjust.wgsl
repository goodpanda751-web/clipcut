struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) tex_coord: vec2f,
}

struct EffectUniforms {
    resolution: vec2f,
    direction: vec2f,
    // x: brightness (-1..1), y: contrast (-1..1),
    // z: saturation (-1..1), w: warmth (-1..1)
    scalars: vec4f,
}

@group(0) @binding(0) var input_texture: texture_2d<f32>;
@group(0) @binding(1) var input_sampler: sampler;
@group(1) @binding(0) var<uniform> uniforms: EffectUniforms;

@fragment
fn fragment_main(input: VertexOutput) -> @location(0) vec4f {
    let color = textureSample(input_texture, input_sampler, input.tex_coord);
    var rgb = color.rgb;

    // Saturation first so brightness/contrast act on the graded colour.
    let luma = dot(rgb, vec3f(0.2126, 0.7152, 0.0722));
    rgb = mix(vec3f(luma), rgb, 1.0 + uniforms.scalars.z);

    // Warmth: push red up and blue down (or the reverse for cool).
    rgb = rgb + vec3f(0.08, 0.0, -0.08) * uniforms.scalars.w;

    // Contrast around mid-grey, then brightness as a straight lift.
    rgb = (rgb - vec3f(0.5)) * (1.0 + uniforms.scalars.y) + vec3f(0.5);
    rgb = rgb + vec3f(uniforms.scalars.x);

    return vec4f(clamp(rgb, vec3f(0.0), vec3f(1.0)), color.a);
}
