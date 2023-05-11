// water.frag

precision mediump float;

uniform float time;
uniform float resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float amplitude = sin(uv.x + time) + sin(uv.y + time);

  gl_FragColor = vec4(vec3(amplitude), 1.0);
}
