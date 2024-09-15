import { SVG } from './svg.js';
import { Vec2 } from './vec2.js'
import { Spline, SplineType } from './splines.js';
import { color } from './color.js';

const lerp = (a, b, t) => a + t * (b - a);
const lerpCol = (a, b, t) => {
  console.log(t)
  return a.map((x, i) => Math.floor(lerp(x, b[i], t)));
}


/**
 * Render a set of bezier segments.
 * @param {Array<BezierSegment>} segments The list of segments ro render.
 * @param {SVG} svg The svg target.
 * @param {boolean} debug Whether to draw with handles.
 * @param {string} color The color of the curve.
 */
function render(segments, svg, debug = true, color = 'white') {

  const lineWidth = 1;
  const handleSize = 2;

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];

    if (debug) {
      svg.path([s.p0, s.p1], { 'stroke': 'gray' }, false);
      svg.path([s.p2, s.p3], { 'stroke': 'gray' }, false);
    }

    svg.bez([s.renderSvg()], { 'stroke': color, 'stroke-width': lineWidth, 'fill': 'none' }, false);

    if (debug) {
      svg.ellipse(s.p1.x, s.p1.y, handleSize, handleSize, { 'fill': 'gray' });
      svg.ellipse(s.p2.x, s.p2.y, handleSize, handleSize, { 'fill': 'gray' });
      svg.ellipse(s.p0.x, s.p0.y, handleSize, handleSize, { 'fill': 'white' });
      svg.ellipse(s.p3.x, s.p3.y, handleSize, handleSize, { 'fill': 'white' });
      svg.text(i, s.p0.x + 2 * handleSize, s.p0.y + 2 * handleSize, { 'font-family': 'sans-serif', 'fill': 'white' });
    }
  }
}

function renderGradient(segments, svg) {
  const lineWidth = 10;

  const colA = color('');
  const colB = color('');

  const res = 100;
  const total = res * segments.length;
  console.log(total)


  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const pts = s.renderPoints(res);


    for (let j = 0; j < pts.length - 1; j++) {
      const num = (i * res) + j;
      console.log(num, num / total);
      let prog = num / total;
      // const prog = Math.sin(num / 12) * 0.5 + 0.5;
      prog = Math.cos(Math.PI * 2 * prog) * 0.5 + 0.5;
      console.log(prog)
      const col = colA.blend(colB, prog, 'RGB');
      console.log(col)
      svg.path([pts[j], pts[j + 1]], {
        'stroke': col.rgbString(),
        'stroke-width': lineWidth,
        'stroke-linecap': 'round',
        'fill': 'blue'
      });
    }
  }
}



const svg = new SVG(1000, 1000);
document.body.append(svg.root);

let anchors = [];
const count = 4

const r = (mn, mx) => {
  return Math.random() * (mx - mn) + mn;
}


for (let i = 0; i < count; i++) {
  anchors.push(new Vec2(r(200, 800), r(200, 800)));
};

const splineA = new Spline(anchors, {
  type: SplineType.Hobby,
  closed: true,
  tension: 0
});

const splineB = new Spline(anchors, {
  type: SplineType.Cubic,
  closed: true,
  tension: 0
});



let frame = 0;

function animate() {
  svg.clear();
  // renderGradient(splineA.segments, svg, true, 'blue');
  render(splineA.segments, svg, true, 'hotpink');
  render(splineB.segments, svg, true, 'yellow');

}

animate();