uniform float time;
varying vec2 vUv;
uniform sampler2D waterNormals; // Water normal map texture

void main() {
    float amplitude = 0.1;
    float frequency = 2.0;
    float speed = 0.3;

    float distortion = sin(time * speed + vUv.x * frequency) * amplitude * sin(time * speed + vUv.y * frequency) * amplitude;

    vec3 color = vec3(0.0, 0.5, 1.0);
    vec3 finalColor = color + distortion;

    vec2 normalMap = texture2D(waterNormals, vUv).rg;
    vec3 normal = vec3(normalMap, sqrt(1.0 - dot(normalMap, normalMap))); // Convert 2-component vector to 3-component vector
    finalColor += normal * 0.1; // Adjust the intensity of the normal map

    gl_FragColor = vec4(finalColor, 1.0);
}



// uniform float time;
// varying vec2 vUv;

// void main() {
//     // Use the fragment's UV coordinates as the base color
//     vec3 color = vec3(vUv, 0.0);

//     // Add some animation to the color
//     color += vec3(sin(time), sin(time + 0.3), sin(time + 0.6)) * 0.1;

//     // Adjust the color to resemble clear blue water
//     color = vec3(0.0, 0.5, 1.0) + color * 0.2;

//     gl_FragColor = vec4(color, 1.0);
// }
