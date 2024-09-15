export class Vec2 extends Array {
  constructor(x = 0, y = 0) {
    super();
    this[0] = x;
    this[1] = y;
  }

  get x() { return this[0]; }
  set x(val) { return this[0] = val; }

  get y() { return this[1]; }
  set y(val) { return this[1] = val; }

  clone() {
    return new Vec2(this.x, this.y);
  }

  static mag(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  }

  static lerp(a, b, t = 0.5) {
    const x = a[0] * (1 - t) + b[0] * t;
    const y = a[1] * (1 - t) + b[1] * t;
    return new Vec2(x, y);
  }

  static angleBetween(a, b) {
    return Math.atan2(b[1] * a[0] - b[0] * a[1], a[0] * b[0] + a[1] * b[1]);
  }

  static scale(a, s) {
    return new Vec2(a[0] * s, a[1] * s);
  }


  static add(a, b) {
    return new Vec2(a[0] + b[0], a[1] + b[1]);
  }

  static sub(a, b) {
    return new Vec2(a[0] - b[0], a[1] - b[1]);
  }

  static rotate(a, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Vec2(a[0] * c - a[1] * s, a[0] * s + a[1] * c);
  }

  static norm(a) {
    let l = Vec2.mag(a);
    return new Vec2(a[0] / l, a[1] / l);
  }
}