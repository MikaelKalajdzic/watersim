uniform mat4 projection, modelview, normalMat;
varying vec3 normalInterp;
varying vec3 vertPos;

void main() {
  normalInterp = normalize(normalMatrix * normal);
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vertPos = viewPosition.xyz / viewPosition.w;
  gl_Position = projectionMatrix * viewPosition;
}
