export function todo(message) {
  console.log('TODO:', message);
}

/**
 * Fill an array of length n with some value.
 * @param {number} n
 * @param {any} fill
 * @return {any[]}
 */
export function arr(n, fill = 0) {
  return Array(n).fill(fill);
}


export function colToNum(color) {
  const elem = document.createElement('div');
  elem.style.color = color;
  document.body.append(elem)
  const computed = window.getComputedStyle(elem).color;
  elem.remove();
  const match = computed.match(/\d+/g).map(Number);
  const num = (match[0] << 16) | (match[1] << 8) | match[2];
  console.log(num)
  return num;
}
export function colToArr(color) {
  const elem = document.createElement('div');
  elem.style.color = color;
  document.body.append(elem)
  const computed = window.getComputedStyle(elem).color;
  elem.remove();
  return computed.match(/\d+/g).map(Number);
}

export function arrToCol([r, g, b]) {
  const str = '#' + r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0');
  return str;
}

export function numToCol(num) {
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = (num) & 0xff;
  const str = '#' + r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0');
  return str;
}