uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uObjectColor;
uniform float uSpecularStrength;
uniform float uShininess;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vec3 ambient = vec3(0.1, 0.1, 0.1);

    vec3 lightDirection = normalize(uLightPosition - vViewPosition);
    vec3 viewDirection = normalize(-vViewPosition);
    vec3 halfwayDirection = normalize(lightDirection + viewDirection);

    float diffuseIntensity = max(dot(vNormal, lightDirection), 0.0);
    vec3 diffuse = uLightColor * uObjectColor * diffuseIntensity;

    float specularIntensity = pow(max(dot(vNormal, halfwayDirection), 0.0), uShininess);
    vec3 specular = uLightColor * uSpecularStrength * specularIntensity;

    vec3 result = ambient + diffuse + specular;
    gl_FragColor = vec4(result, 1.0);
}