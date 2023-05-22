uniform float time;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;

  // Add some wave effect to the water surface
  pos.z += sin(pos.x * 10.0 + time) * 0.1;
  pos.z += sin(pos.y * 10.0 + time) * 0.1;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}