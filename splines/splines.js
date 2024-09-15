/**
 * @file Spline generators.
 */
import { Vec2 } from "./vec2.js";
import { solveTridiagonalMatrix } from "./matrix.js";
import { arr, todo } from "./utils.js";


/**
 * Get a cubic bezier pt at t.
 * @param {Vec2} p0
 * @param {Vec2} p1
 * @param {Vec2} p2
 * @param {Vec2} p3
 * @param {number} t
 * @return {number[]} An [x,y] tuple
 */
function cubicBezier(p0, p1, p2, p3, t) {
  const a = (1 - t) ** 3;
  const b = 3 * ((1 - t) ** 2) * t;
  const c = 3 * (1 - t) * (t ** 2);
  const d = (t ** 3);
  const x = p0.x * a + p1.x * b + p2.x * c + p3.x * d;
  const y = p0.y * a + p1.y * b + p2.y * c + p3.y * d;
  return [x, y];
}


/**
 * A single bezier segment of a larger spline.
 * @property {Vec2} p0 The start anchor.
 * @property {Vec2} p3 The end anchor.
 * @property {Vec2} p1 The first handle.
 * @property {Vec2} p2 The second handle.
 */
export class BezierSegment {
  /**
   * @param {Vec2} start The start anchor.
   * @param {Vec2} end The end anchor.
   */
  constructor(start, end) {
    this.p0 = new Vec2(start.x, start.y);
    this.p3 = new Vec2(end.x, end.y);
    this.p1 = new Vec2();
    this.p2 = new Vec2();
  }


  /**
   * Get points to draw as SVG.
   * @return {Vec2[]}
   */
  renderSvg() {
    return [this.p0, this.p1, this.p2, this.p3];
  }


  /**
   * Get points to draw as straight lines.
   * @param {number} resolution The number of straight line segments used to 
   *     approximate the curve.
   */
  renderPoints(resolution = 10) {
    const pts = [];
    for (let i = 0; i < resolution; i++) {
      const t = i / (resolution - 1);
      pts.push(cubicBezier(this.p0, this.p1, this.p2, this.p3, t));
    }
    return pts;
  }
}


/**
 * Enum for spline types.
 * @enum {string}
 */
export const SplineType = {
  Cubic: 'CUBIC',
  Hobby: 'HOBBY',
}


/**
 * A spline object.
 * @property {SplineType} type The type of the spline.
 * @property {Vec2[]} anchors The anchor points.
 * @property {BezierSegment[]} segments The BezierSegments.
 * @property {number} tension The "tension" number for the spline. 
 * @property {boolean} closed Whether the spline is closed. 
 * 
 */
export class Spline {
  constructor(anchors, options = {}) {
    this.anchors = anchors;
    this.type = options.type ?? SplineType.Cubic;
    this.closed = options.closed ?? false;
    this.segments = anchorsToSegments(this.anchors, this.closed);
    this.tension = options.tension ?? 0.5;
    this.solve();
  }

  solve() {
    switch (this.type) {

    case SplineType.Cubic:
      this.closed ? naturalCubicClosed(this.segments) : naturalCubicOpen(this.segments);
      break;

    case SplineType.Hobby:
      this.closed ? hobbyClosed(this.segments) : hobbyOpen(this.segments);
      break;
    }
  }
}



/**
 * Make n-1 BezierSegments from n anchor points.
 * @param {Vec2[]} anchors The input anchor points.
 * @param {boolean} closed Whether the curve is closed.
 * @return {BezierSegment[]} The output segments.
 */
export function anchorsToSegments(anchors, closed = false) {
  if (anchors.length <= 1) {
    throw new Error('Not enough anchor points.')
  }

  if (anchors.length === 2 && !closed) {
    const segment = new BezierSegment(anchors[0], anchors[1]);
    segment.controls(anchors[0], anchors[1]);
    return [segment];
  }

  const segments = [];

  for (let i = 0; i < anchors.length - 1; i++) {
    segments.push(new BezierSegment(anchors[i], anchors[i + 1]));
  }

  if (closed) {
    segments.push(new BezierSegment(anchors[anchors.length - 1], anchors[0]));
  }

  return segments;
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Cubic Spline
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

/**
 * Solve the open variant of natural cubic spline over a list of BezierSegments. 
 * The solve happens in place on those segments.
 * @param {BezierSegment[]} segments
 * @void
 * @private
 */
function naturalCubicOpen(segments) {
  const n = segments.length;

  const A = arr(n); // Below diagonal
  const B = arr(n); // Main diagonal
  const C = arr(n); // Above diagonal
  const DX = arr(n); // Solutions x
  const DY = arr(n); // Solutions y

  for (let i = 0; i < n; i++) {

    const p0 = segments[i].p0;
    const p3 = segments[i].p3;

    // First segment
    if (i === 0) {

      A[i + 1] = 1;
      B[i] = 2;
      C[i] = 1;

      DX[i] = p0.x + 2 * p3.x;
      DY[i] = p0.y + 2 * p3.y;

    } else if (i === n - 1) {

      A[i + 1] = 2;
      B[i] = 7;
      C[i] = 0;

      DX[i] = 8 * p0.x + p3.x
      DY[i] = 8 * p0.y + p3.y;

    } else {

      A[i + 1] = 1;
      B[i] = 4;
      C[i] = 1;

      DX[i] = 4 * p0.x + 2 * p3.x;
      DY[i] = 4 * p0.y + 2 * p3.y;
    }
  }

  const X = solveTridiagonalMatrix(A, B, C, DX);
  const Y = solveTridiagonalMatrix(A, B, C, DY);

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    segment.p1.x = X[i];
    segment.p1.y = Y[i];

    if (i === segments.length - 1) {
      segment.p2.x = 0.5 * (segments[i].p3.x + X[i]);
      segment.p2.y = 0.5 * (segments[i].p3.y + Y[i]);
    } else {
      segment.p2.x = 2 * segments[i + 1].p0.x - X[i + 1];
      segment.p2.y = 2 * segments[i + 1].p0.y - Y[i + 1];
    }
  }
}


/**
 * Solve the closed natural cubic spline over a list of BezierSegments. The
 * solve happens in place.
 * @param {BezierSegment[]} segments
 * @void
 */
function naturalCubicClosed(segments) {
  const n = segments.length;

  const A = arr(n); // Below diagonal
  const B = arr(n); // Main diagonal
  const C = arr(n); // Above diagonal
  const DX = arr(n); // Solutions x
  const DY = arr(n); // Solutions y

  for (let i = 0; i < n; i++) {

    const p0 = segments[i].p0;
    const p3 = segments[i].p3;

    A[i] = 1;
    B[i] = 4;
    C[i] = 1;

    DX[i] = 4 * p0.x + 2 * p3.x;
    DY[i] = 4 * p0.y + 2 * p3.y;
  }

  const X = solveTridiagonalMatrix(A, B, C, DX);
  const Y = solveTridiagonalMatrix(A, B, C, DY);

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    segment.p1.x = X[i];
    segment.p1.y = Y[i];

    segment.p2.x = 2 * segments[(i + 1) % n].p0.x - X[(i + 1) % n];
    segment.p2.y = 2 * segments[(i + 1) % n].p0.y - Y[(i + 1) % n];
  }
}


/**
 * Get a cubic spline.
 */
export function cubicSpline(anchors, closed = false) {
  const segments = anchorsToSegments(anchors, closed);
  const solve = closed ?
    () => naturalCubicClosed(segments) :
    () => naturalCubicOpen(segments);
  solve();
  return { segments, solve };
}


// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Hobby Splines
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

/**
 * The hobby spline rho function proposed in jake low's impl.
 * @param {number} alpha
 * @param {number} beta
 * @return {number}
 */
function rho(alpha, beta) {
  let c = 2 / 3;
  return 2 / (1 + c * Math.cos(beta) + (1 - c) * Math.cos(alpha));
}


/**
 * Solve the open hobby spline cubic spline over a list of BezierSegments. The
 * solve happens in place.
 * @param {BezierSegment[]} segments
 * @void
 */
function hobbyOpen(segments, omega = 0) {
  const n = segments.length;

  // chords[i] is the straight line segment from s[i].p0 to s[i].p3.
  const chords = [];

  // lens[i] is the length of chords[i]
  const lens = [];

  for (let i = 0; i < n; i++) {
    const segment = segments[i];
    chords.push(Vec2.sub(segment.p3, segment.p0));
    lens.push(Vec2.mag(chords[i]));
    if (lens[i] <= 0) {
      throw new Error('Zero distance segment.')
    }
  }

  // gamma[i] is singed turing angle at s[i].p0 – the angle between the chord 
  // coming into the knot and the one leaving it.
  // gamma[0] is set to 0 but should not be acessed. gamma[n] is also set to 0. 
  const gamma = [0];
  for (let i = 1; i < n; i++) {
    gamma.push(Vec2.angleBetween(chords[i - 1], chords[i]))
  }
  gamma[n] = 0;

  const A = arr(n + 1, 0);
  const B = arr(n + 1, 0);
  const C = arr(n + 1, 0);
  const D = arr(n + 1, 0);

  B[0] = 2 + omega;
  C[0] = 2 * omega + 1
  C[0] = -1 * C[0] * gamma[1];

  for (let i = 1; i < n; i++) {
    A[i] = 1 / lens[i - 1];
    B[i] = (2 * lens[i - 1] + 2 * lens[i]) / (lens[i - 1] * lens[i]);
    C[i] = 1 / lens[i];
    D[i] = (-1 * (2 * gamma[i] * lens[i] + gamma[i + 1] * lens[i - 1])) / (lens[i - 1] * lens[i]);
  }

  A[n] = 2 * omega + 1;
  B[n] = 2 + omega;
  D[n] = 0;

  let alpha = solveTridiagonalMatrix(A, B, C, D);

  let beta = arr(n, 0);

  for (let i = 0; i < n - 1; i++) {
    beta[i] = -1 * gamma[i + 1] - alpha[i + 1];
  }
  beta[n - 1] = -1 * alpha[n];


  for (let i = 0; i < n; i++) {
    const a = (rho(alpha[i], beta[i]) * lens[i]) / 3;
    const b = (rho(beta[i], alpha[i]) * lens[i]) / 3;


    const p0 = segments[i].p0;
    const p3 = segments[i].p3;

    const cp1 = Vec2.add(p0.clone(), Vec2.scale(Vec2.norm(Vec2.rotate(chords[i], alpha[i])), a));
    const cp2 = Vec2.sub(p3.clone(), Vec2.scale(Vec2.norm(Vec2.rotate(chords[i], -beta[i])), b));

    segments[i].p1.x = cp1.x;
    segments[i].p1.y = cp1.y;
    segments[i].p2.x = cp2.x;
    segments[i].p2.y = cp2.y;
  }
}


/**
 * Solve the closed hobby spline cubic spline over a list of BezierSegments. The
 * solve happens in place.
 * @param {BezierSegment[]} segments
 * @void
 */
function hobbyClosed(segments, omega = 0) {
  const n = segments.length;

  // chords[i] is the straight line segment from s[i].p0 to s[i].p3.
  const chords = [];

  // lens[i] is the length of chords[i]
  const lens = [];

  for (let i = 0; i < n; i++) {
    const segment = segments[i];
    chords.push(Vec2.sub(segment.p3, segment.p0));
    lens.push(Vec2.mag(chords[i]));
    if (lens[i] <= 0) {
      throw new Error('Zero distance segment.')
    }
  }

  // gamma[i] is singed turning angle at s[i].p0 – the angle between the chord 
  // coming into the knot and the one leaving it.
  // gamma[0] is set to 0 but should not be accessed. gamma[n] is also set to 0. 
  const gamma = [];
  for (let i = 0; i < n + 1; i++) {
    const wrappedBefore = (i - 1 + n) % n;
    gamma.push(Vec2.angleBetween(chords[wrappedBefore], chords[i % n]))
  }

  const A = arr(n + 1, 0);
  const B = arr(n + 1, 0);
  const C = arr(n + 1, 0);
  const D = arr(n + 1, 0);

  for (let i = 0; i < n + 1; i++) {
    const prev = (i - 1 + n) % n;
    const next = (i + 1) % n;
    A[i] = 1 / lens[prev];
    B[i] = (2 * lens[prev] + 2 * lens[i % n]) / (lens[prev] * lens[i % n]);
    C[i] = 1 / lens[i];
    D[i] = (-1 * (2 * gamma[i % n] * lens[i % n] + gamma[next] * lens[prev])) / (lens[prev] * lens[i % n]);
  }

  let alpha = solveTridiagonalMatrix(A, B, C, D);
  let beta = arr(n, 0);

  for (let i = 0; i < n; i++) {
    beta[i] = -1 * gamma[(i + 1) % n] - alpha[(i + 1) % n];
  }

  for (let i = 0; i < n; i++) {
    const a = (rho(alpha[i], beta[i]) * lens[i]) / 3;
    const b = (rho(beta[i], alpha[i]) * lens[i]) / 3;

    const p0 = segments[i].p0;
    const p3 = segments[i].p3;

    const cp1 = Vec2.add(p0.clone(), Vec2.scale(Vec2.norm(Vec2.rotate(chords[i], alpha[i])), a));
    const cp2 = Vec2.sub(p3.clone(), Vec2.scale(Vec2.norm(Vec2.rotate(chords[i], -beta[i])), b));

    segments[i].p1.x = cp1.x;
    segments[i].p1.y = cp1.y;
    segments[i].p2.x = cp2.x;
    segments[i].p2.y = cp2.y;
  }
}