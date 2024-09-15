const { cos, sin, PI, random, min, max, floor } = Math;

// random num (-1:1)
const r = () => random() * 2 - 1;

// math
const clamp = (n, mn = 0, mx = 1) => max(min(mx, n), mn);
const lerp = (a, b, t) => a + t * (b - a);
const remap = (v, i1, i2, o1, o2) => {
  const t = clamp((v - i1) / (i2 - i1));
  return lerp(o1, o2, t);
}

const rcol = (opacity = 255) => `#${floor(random() * 2 ** 23 + 2 ** 23).toString(16)}${opacity.toString(16)}`;

// if this works, the math funcs probably are fine
console.assert(8 == remap(0.5, 0, 1, 0, 16));

function applyAttrs(elem, attrs) {
  for (let [name, value] of Object.entries(attrs)) {
    elem.setAttribute(name, value);
  }
  return elem;
}

function makeNS(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function makeSVG(w, h) {
  const elem = makeNS('svg');
  elem.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
  applyAttrs(elem, {
    width: w,
    height: h,
  });
  document.body.appendChild(elem);
  return elem;
}

const root = makeSVG(window.innerWidth, window.innerHeight);

const atoms = [];
const springs = [];
const molecules = [];

const MOUSE = [window.innerWidth / 2, window.innerHeight / 2];
const grav = 800;

let TIME = 0;


class Point {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.velocity = [0, 0];

    this.elem = makeNS('circle');
    applyAttrs(this.elem, {
      cx: this.x,
      cy: this.y,
      r: this.radius,
      'fill': color
    });

    root.appendChild(this.elem);
    atoms.push(this);

    this.contraint = false;
  }

  update(timeStep) {
    if (this.contraint) return;

    this.x += this.velocity[0] * timeStep;
    this.y += this.velocity[1] * timeStep;

    applyAttrs(this.elem, {
      cx: this.x,
      cy: this.y,
    });
  }

  calculateForce(timeStep) {
    const dx = this.x - MOUSE[0];
    const dy = this.y - MOUSE[1];

    const d = Math.sqrt(dx * dx + dy * dy);
    const g = remap(d, 200, 0, 0, grav);

    const dxn = dx / d;
    const dyn = dy / d;

    const w = cos(this.x * 0.001 + TIME * 0.001, sin(this.y * 0.001 + TIME * 0.001));

    return [dxn * g, dyn * g];
  }
}


class SpringConnection {
  constructor(a, b, restLen) {
    this.a = a;
    this.b = b;
    this.elem = makeNS('line');
    this.K = 1;
    this.restLen = restLen + r() * 1;

    applyAttrs(this.elem, {
      x1: this.a.x,
      x2: this.b.x,
      y1: this.a.y,
      y2: this.b.y,
      stroke: 'white',
      'stroke-width': 1
    });

    root.prepend(this.elem);
    springs.push(this);
  }

  calculateForce() {
    const dx = this.a.x - this.b.x;
    const dy = this.a.y - this.b.y;

    const len = Math.sqrt(dx * dx + dy * dy);
    const dLen = (len - this.restLen);

    return [
      [this.a, [-this.K * dLen * dx, -this.K * dLen * dy]],
      [this.b, [+this.K * dLen * dx, +this.K * dLen * dy]],
    ];
  }

  update() {
    applyAttrs(this.elem, {
      x1: this.a.x,
      x2: this.b.x,
      y1: this.a.y,
      y2: this.b.y,
    });
  }



  applyForce(timeStep) {
    const dx = this.a.x - this.b.x;
    const dy = this.a.y - this.b.y;

    const force = [this.K * dx, this.K * dy];
    this.a.velocity[0] -= force[0] * timeStep;
    this.b.velocity[0] += force[0] * timeStep;
    this.a.velocity[1] -= force[1] * timeStep;
    this.b.velocity[1] += force[1] * timeStep;
  }
}



const count = 36;
const size = 800;
const remapPt = i => remap(i, 0, count - 1, -size / 2, size / 2);

const GRID = [];


for (let i = 0; i < count; i++) {
  const row = [];
  for (let j = 0; j < count; j++) {
    const pt = new Point(remapPt(j) + window.innerWidth / 2, remapPt(i) + window.innerHeight / 2, 2, 'white');
    row.push(pt);

    const topBottom = i === 0 || i === count - 1;
    const leftRight = j === 0 || j === count - 1;
    if (topBottom && leftRight) pt.contraint = true;

  }
  GRID.push(row);
}

for (let i = 0; i < count; i++) {
  for (let j = 0; j < count; j++) {

    // DEMO HERE
    if (Math.random() < 0.1) continue;

    if (j < count - 1) {
      new SpringConnection(GRID[i][j], GRID[i][j + 1], size / count);
    }
    if (i < count - 1) {
      new SpringConnection(GRID[i][j], GRID[i + 1][j], size / count)
    }
  }
}



let timeAtLastTick = performance.now();

function animate() {

  let time = TIME = performance.now();
  let dt = (time - timeAtLastTick) / 1000;
  timeAtLastTick = time;

  const forcesByAtom = new Map();

  for (let atom of atoms) {
    const force = atom.calculateForce();
    forcesByAtom.set(atom, [force[0], force[1]]);
  }

  for (let spring of springs) {
    const forces = spring.calculateForce();
    for (let [atom, force] of forces) {
      if (forcesByAtom.has(atom)) {
        forcesByAtom.get(atom)[0] += force[0];
        forcesByAtom.get(atom)[1] += force[1];
      } else {
        forcesByAtom.set(atom, [force[0], force[1]]);
      }
    }
  }

  for (let [atom, force] of forcesByAtom) {
    atom.velocity[0] += force[0] * dt * 10;
    atom.velocity[1] += force[1] * dt * 10;
  }

  for (let atom of atoms) {
    atom.update(dt);

    atom.velocity[0] *= (0.9)
    atom.velocity[1] *= (0.9)

  }
  for (let spring of springs) {
    spring.update(dt);
  }

  requestAnimationFrame(animate);
}

window.addEventListener('mousemove', e => {
  MOUSE[0] = e.clientX;
  MOUSE[1] = e.clientY;

});

animate();