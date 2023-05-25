uniform mat4 projection, modelview, normalMat;
varying vec3 normalInterp;
varying vec3 vertPos;

void main(){
  vec3 pos = position;
  vec3 norm = normal;
  vec4 vertPos4 = modelview * vec4(pos, 1.0);
  vertPos = vec3(vertPos4) / vertPos4.w;
  normalInterp = vec3(normalMat * vec4(norm, 0.0));
  gl_Position = projection * vertPos4;
}
