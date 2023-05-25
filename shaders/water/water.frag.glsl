precision highp float;

uniform float time;
uniform sampler2D reflectionMap;
uniform sampler2D refractionMap;
uniform sampler2D normalMap;
uniform vec3 lightDirection;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Calculate distortion offset based on time and UV coordinates
  float distortionStrength = 0.02;
  vec2 distortionOffset = vec2(
    sin(uv.y * 10.0 + time) * distortionStrength,
    cos(uv.x * 10.0 + time) * distortionStrength
  );

  // Apply distortion offset to UV coordinates
  uv += distortionOffset;

  // Get reflection and refraction colors from texture maps
  vec4 reflectionColor = texture2D(reflectionMap, uv);
  vec4 refractionColor = texture2D(refractionMap, uv);

  // Apply normal mapping to get the water normal
  vec3 normal = normalize(texture2D(normalMap, uv).xyz * 2.0 - 1.0);

  // Calculate fresnel effect
  float fresnelStrength = 0.6;
  float fresnel = pow(1.0 - dot(normalize(lightDirection), normal), fresnelStrength);

  // Apply lighting to the water surface
  vec3 waterColor = vec3(1.0, 0.3, 0.6); // Adjust the water color as desired
  vec3 lightColor = vec3(1.0, 1.0, 1.0); // Adjust the light color as desired
  vec3 diffuse = max(dot(normalize(lightDirection), normal), 0.0) * lightColor;
  vec3 specular = vec3(0.0);
  vec3 viewDirection = normalize(vec3(0.0, 0.0, 1.0)); // Assuming view direction is along the positive z-axis

  if (diffuse.r > 0.0) {
    vec3 halfwayDirection = normalize(lightDirection + viewDirection);
    float shininess = 32.0; // Adjust the shininess as desired
    specular = pow(max(dot(normal, halfwayDirection), 0.0), shininess) * lightColor;
  }

  // Combine reflection and refraction colors based on the fresnel effect
  vec4 finalColor = mix(reflectionColor, refractionColor, fresnel);

  // Apply lighting and water color to the final color
  finalColor.rgb = finalColor.rgb * (waterColor + diffuse) + specular;

  gl_FragColor = finalColor;
}
