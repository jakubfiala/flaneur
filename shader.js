export default `
# define SPEED 0.5
# define PI 3.1415926538

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform int invert;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 rand2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

float voro(vec2 uv, float time, float scale) {
  vec2 st = uv * scale;
  // Tile the space
  vec2 i_st = floor(st);
  vec2 f_st = fract(st);

  float m_dist = 1.;  // minimum distance

  for (int y= -1; y <= 1; y++) {
    for (int x= -1; x <= 1; x++) {
      // Neighbor place in the grid
      vec2 neighbor = vec2(float(x),float(y));

      // Random position from current + neighbor place in the grid
      vec2 point = rand2(i_st + neighbor);

      // Animate the point
      point = 0.5 + 0.5 * sin(time + 6.2831 * point);

      // Vector between the pixel and the point
      vec2 diff = neighbor + point - f_st;

      // Distance to the point
      float dist = length(diff);

      // Keep the closer distance
      m_dist = min(m_dist, dist);
    }
  }

  return m_dist;
}

void main() {
  vec2 res = resolution.xy;
  vec2 uv = vec2(gl_FragCoord.xy - 0.5 * res) / res.y;
  uv = uv + vec2(0.5, 0.5);

  float tp = time * SPEED;

  float noise = (0.2 * rand(1.0e2 * uv + time * 0.0001) - 0.15);
  float cells1 = voro(uv, tp, 9.0);
  float cells2 = voro(vec2(uv.y, uv.x), tp + 0.5, 5.0);
  float cells3 = voro(vec2(uv.x, uv.y), tp * 0.5 + 1.0, 8.0);
  float intro = clamp(tp, 0.0, 0.4);
  float focus = 2.0 - length(vec2(1.0 - uv.x, uv.y));

  float cells = cells1 / cells2 / cells3;
  float full = cells * focus - noise;

  gl_FragColor = vec4(vec3(full), intro);
}
`;
