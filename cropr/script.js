// Global handles for the canvas and the context.
const cnvs = document.querySelector('canvas');
const ctx = cnvs.getContext('2d');

// Function to clean up filenames. 
const cleanName = name => {
  return name.toLowerCase()
    .replaceAll(' ', '-')
    .replace('.jpg', '.png')
}

// Clamp a number between 0 and 1.
const clamp01 = x => x > 1 ? 1 : (x < 0 ? 0 : x);

// Get a pixel index from x, y.
const px = (x, y) => x * 4 + y * cnvs.width * 4;

// A current handler for mouse movement.
let dragTarget = null;


// Guide state.
let guideColor = '#ffff0088';
let guides = [];
let showGuides = true;

// Image and transform state.
let source = null;
let filename = null;
const state = {
  translation: [0, 0],
  rotation: 0,
  // scale: 0.323,
  scale: 1,
};

/**
 * 
 */
function parseGuidePos(pos, v = true) {
  if (typeof pos === 'string' && pos.indexOf('%') > 0) {
    return Number.parseFloat(pos) * 0.01 * (v ? cnvs.width : cnvs.height);
  }
  if (pos < 0) {
    return (v ? cnvs.width + pos : cnvs.height + pos);
  }
  return pos;
}

// Make a vetical guide.
const vGuides = (...args) => guides.push(...args.map(a => ({ dir: 'v', pos: a })));
const hGuides = (...args) => guides.push(...args.map(a => ({ dir: 'h', pos: a })));


// Render the guides.
function renderGuides() {
  ctx.strokeStyle = guideColor;
  for (const guide of guides) {
    if (guide.dir === 'v') {
      const pos = parseGuidePos(guide.pos, true);
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, cnvs.height);
      ctx.stroke();
    } else {
      const pos = parseGuidePos(guide.pos, false);
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(cnvs.width, pos);
      ctx.stroke();
    }
  }
}

// Clear the guides.
function clearGuides() {
  guides = [];
  render();
}

// -----------------------------------------------------------------------------

// Open a file and load into the canvas.
async function openFile(e) {
  const reader = new FileReader();
  reader.onload = function () {
    const img = document.createElement('img')
    img.src = reader.result;
    source = img;
    img.onload = function () {
      source = img;
      render();
    }
  }
  reader.readAsDataURL(e.target.files[0]);
  filename = cleanName(e.target.files[0].name)
}

// Save the file.
function saveFile() {
  const link = document.createElement('a');
  showGuides = false;
  render();
  const data = cnvs.toDataURL('image/png', 1);
  link.download = document.getElementById('prefix').value;
  link.href = data;
  link.click();

  showGuides = true;
  render();
}

// Render the canvas.
function render() {
  ctx.clearRect(0, 0, cnvs.width, cnvs.height);
  ctx.resetTransform();

  // ctx.fillStyle = "";
  // ctx.fillRect(0, 0, cnvs.width, cnvs.height);

  if (source) {
    const scale = state.scale;
    ctx.translate(cnvs.width / 2, cnvs.height / 2);
    ctx.rotate(state.rotation);
    ctx.scale(state.scale, state.scale);
    ctx.translate(-cnvs.width / 2, -cnvs.height / 2);
    ctx.translate(state.translation[0], state.translation[1]);
    ctx.drawImage(source, 0, 0);

    if (!dragTarget) {
      // filter(adjustment);
      // floydSteinberg();
    }
  }

  if (showGuides) {
    ctx.resetTransform();
    renderGuides();
  }
}


vGuides(10, '33.33333%', '50%', '66.666667%', -10);
hGuides(10, '33.33333%', '50%', '66.666667%', -10);

render();


window.onmouseup = () => {
  dragTarget = null;
  render();
}
window.onmousemove = (e) => {
  if (!dragTarget) return;
  dragTarget(e.movementX, e.movementY);
}


function draggable(elem, fn) {
  elem.onmousedown = () => {
    dragTarget = fn;
  }
}

draggable(cnvs, (x, y) => {
  state.translation[0] += x / state.scale;
  state.translation[1] += y / state.scale;
  render();
});

draggable(document.getElementById('zoom-level'), (x, y) => {
  state.scale += y * 0.001;
  render();
});

draggable(document.getElementById('rotate'), (x, y) => {
  state.rotation += x * 0.001;
  render();
});

document.getElementById('open').onchange = openFile;
document.getElementById('save').onclick = saveFile;

document.getElementById('canvas-width').value = cnvs.width;
document.getElementById('canvas-width').oninput = (e) => {
  cnvs.width = e.target.value;
  render();
}

document.getElementById('canvas-height').value = cnvs.height;
document.getElementById('canvas-height').oninput = (e) => {
  cnvs.height = e.target.value;
  render();
}



function filter(pixelFn) {
  const pixels = ctx.getImageData(0, 0, cnvs.width, cnvs.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const rgba = pixelFn(...pixels.data.slice(i, i + 4));
    pixels.data[i + 0] = rgba[0];
    pixels.data[i + 1] = rgba[1];
    pixels.data[i + 2] = rgba[2];
    pixels.data[i + 3] = rgba[3];
  }
  ctx.putImageData(pixels, 0, 0);
}

function adjustment(r, g, b, a) {
  let gray = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
  const blackPoint = 0.2;
  const whitePoint = 0.7;
  const range = whitePoint - blackPoint;
  gray = clamp01((gray - blackPoint) / range);
  gray = Math.floor(gray * 255)
  return [gray, gray, gray, a];
}


// https://observablehq.com/@tmcw/dithering
function floydSteinberg() {
  const data = ctx.getImageData(0, 0, cnvs.width, cnvs.height);
  const clone = new ImageData(new Uint8ClampedArray(data.data), cnvs.width, cnvs.height);


  for (let y = 0; y < data.height; y++) {
    for (let x = 0; x < data.width; x++) {
      let oldPixel = clone.data[px(x, y)];
      let newPixel = oldPixel > 125 ? 255 : 0;
      clone.data[px(x, y)] = clone.data[px(x, y) + 1] = clone.data[
        px(x, y) + 2
      ] = newPixel;
      let quantError = oldPixel - newPixel;
      clone.data[px(x + 1, y)] = clone.data[px(x + 1, y) + 1] = clone.data[
        px(x + 1, y) + 2
      ] = clone.data[px(x + 1, y)] + (quantError * 7) / 16;
      clone.data[px(x - 1, y + 1)] = clone.data[
          px(x - 1, y + 1) + 1
        ] = clone.data[px(x - 1, y + 1) + 2] =
        clone.data[px(x - 1, y + 1)] + (quantError * 3) / 16;
      clone.data[px(x, y + 1)] = clone.data[px(x, y + 1) + 1] = clone.data[
        px(x, y + 1) + 2
      ] = clone.data[px(x, y + 1)] + (quantError * 5) / 16;
      clone.data[px(x + 1, y + 1)] = clone.data[
          px(x + 1, y + 1) + 1
        ] = clone.data[px(x + 1, y + 1) + 2] =
        clone.data[px(x + 1, y + 1)] + (quantError * 1) / 16;
    }
  }
  ctx.putImageData(clone, 0, 0);
}