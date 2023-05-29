precision mediump float;
varying vec3 normalInterp;    // Surface normal
varying vec3 vertPos;         // Vertex position
uniform float Ka;             // Ambient reflection coefficient
uniform float Kd;             // Diffuse reflection coefficient
uniform float Ks;             // Specular reflection coefficient
uniform float shininessVal;   // Shininess
uniform vec3 ambientColor;    // Ambient color
uniform vec3 diffuseColor;    // Diffuse color
uniform vec3 specularColor;   // Specular color
uniform vec3 lightPos;        // Light position
uniform sampler2D envMap;
uniform float reflectionIntensity; // Reflection intensity
uniform float opacity; // Add opacity uniform

void main() {
    vec3 N = normalize(normalInterp);
    vec3 L = normalize(lightPos - vertPos);

    // Lambert's cosine law
    float lambertian = max(dot(N, L), 0.0);
    float specular = 0.0;
    if (lambertian > 0.0) {
        vec3 R = reflect(-L, N);      // Reflected light vector
        vec3 V = normalize(-vertPos); // Vector to viewer

        // Compute the specular term
        float specAngle = max(dot(R, V), 0.0);
        specular = pow(specAngle, shininessVal);
    }

    // Compute the reflection color from the environment map
    vec3 reflectionColor = texture2D(envMap, vec2(1.0 - reflect(normalize(vertPos), N).x, reflect(normalize(vertPos), N).y / 2.0 + 0.5)).rgb;

    // Apply the reflection intensity
    reflectionColor *= reflectionIntensity;

    // Combine the ambient, diffuse, specular, and reflection colors
    vec3 finalColor = Ka * ambientColor +
                      Kd * lambertian * diffuseColor +
                      Ks * specular * specularColor +
                      reflectionColor;

    gl_FragColor = vec4(finalColor, opacity); // Modify this line to use opacity
}
