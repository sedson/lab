/**
 * @file Provide some light utility for making SVGs from script.
 */


/**
 * Create an SVG element.
 */
function createSvgElement(type = 'svg') {

  return document.createElementNS('http://www.w3.org/2000/svg', type);
}

/**
 * Create an SVG root element.
 */
function svgRoot(w, h) {
  const elem = createSvgElement('svg');
  attr(elem, {
    'xmlns': 'http://www.w3.org/2000/svg',
    'width': w,
    'height': h,
    'viewBox': `0 0 ${w} ${h}`
  });
  return elem;
}


/**
 * Apply a bag of attributes to an SVG.
 */
function attr(target, attributes) {
  for (let attrib in attributes) {
    target.setAttribute(attrib, attributes[attrib]);
  }
}


/**
 * Get an SVG past form a list of points. [[0, 0], [0, 1]]
 */
function makePath(pts, closed = false) {
  let str = 'M ' + pts[0][0] + ',' + pts[0][1] + ' L ';
  for (let i = 1; i < pts.length; i++) {
    str += pts[i][0] + ',' + pts[i][1] + ' ';
  }
  if (closed) str += ' z';
  return str;
}


/**
 * Get an SVG past form a list of 4 point curves. 
 * [C: [ p0: [x, y], cp1: [x1, y], cp2: [x2, y2], p3: [x3, y3] ] ]
 */
function makeBezPath(curves) {
  let str = '';
  for (let i = 0; i < curves.length; i++) {
    let c = curves[i];
    if (c.length !== 4) continue;
    str += `M ${c[0][0]} ${c[0][1]} `;
    str += `C ${c[1][0]} ${c[1][1]}, `;
    str += `${c[2][0]} ${c[2][1]}, `;
    str += `${c[3][0]} ${c[3][1]} `;
  }
  return str;
}



/**
 * Create an SVG rectangle.
 */
function rect(x, y, w, h) {
  const rectangle = createSvgElement('rect');
  attr(rectangle, { x, y, width: w, height: h });
  return rectangle;
}

/**
 * Create an SVG rectangle.
 */
function ellipse(x, y, w, h) {
  const ellipse = createSvgElement('ellipse');
  attr(ellipse, { cx: x, cy: y, rx: w, ry: h });
  return ellipse;
}

/**
 * Create an SVG path.
 */
function path(d) {
  const path = createSvgElement('path');
  attr(path, { d });
  return path;
}


/**
 * Create an SVG group.
 */
function group() {
  return createSvgElement('g');
}

/**
 * Create an SVG group.
 */
function text(str, x, y) {
  const text = createSvgElement('text');
  attr(text, { x: x, y: y });
  text.innerHTML = str;
  return text;
}



export class SVG {
  constructor(w, h) {
    this.root = svgRoot(w, h);
  }

  clear() {
    this.root.innerHTML = '';
  }

  ellipse(x, y, w, h, attrs = {}) {
    const e = ellipse(x, y, w, h);
    attr(e, attrs);
    this.root.appendChild(e);
    return e;
  }

  path(pts, attrs = {}, closed = false) {
    const d = makePath(pts, closed);
    const e = path(d);
    attr(e, attrs);
    this.root.appendChild(e);
    return e;
  }

  bez(curves, attrs = {}, closed = false) {
    const d = makeBezPath(curves, closed);
    const e = path(d);
    attr(e, attrs);
    this.root.appendChild(e);
    return e;
  }

  rect(x, y, w, h, attrs = {}) {
    const e = rect(x, y, w, h);
    attr(e, attrs);
    this.root.appendChild(e);
    return e;
  }

  text(str, x, y, attrs = {}) {
    const e = text(str, x, y);
    attr(e, attrs);
    this.root.appendChild(e);
    return e;
  }
}