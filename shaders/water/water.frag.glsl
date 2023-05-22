uniform float time;
varying vec2 vUv;

void main() {
    // Use the fragment's UV coordinates as the base color
    vec3 color = vec3(vUv, 0.0);

    // Add some animation to the color
    color += vec3(sin(time), sin(time + 0.3), sin(time + 0.6)) * 0.1;

    gl_FragColor = vec4(color, 1.0);
}
