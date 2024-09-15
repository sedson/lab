/**
 * https://en.wikipedia.org/wiki/Tridiagonal_matrix_algorithm
 * 
 * Solve a sytem of linear equations using the Thomas algorithm, which requires 
 * a triadigonal encoding like this: 
 * 
 * ⌈ b0  c0  0   0  ⌉   ⌈ x0 ⌉   ⌈ d0 ⌉
 * │ a1  b1  c1  0  │ * │ x1 │ = │ d1 │  
 * │ 0   a2  b2  c2 │   │ x2 │   │ d2 │
 * ⌊ 0   0   an  bn ⌋   ⌊ xn ⌋   ⌊ dn ⌋
 * 
 * Where equal length vectors called a, b, c, d are the input and the output is 
 * the x vector in the above diagram.
 * 
 * a[0] is undefined, but the input array must contain something at a[0].
 * c[n] is undefined, but also should contain something at c[n];
 * 
 * @param {number[]} a The "under" matrix coeffs.
 * @param {number[]} b The "main" matrix coeffs.
 * @param {number[]} c The "over matrix coeffs.
 * @param {number[]} d The solution column.
 * @return {number[]} The unknowns
 */
export function solveTridiagonalMatrix(a, b, c, d) {
  const n = b.length - 1;

  // Set up scratch arrays. Underscore denotes prime.
  const c_ = [c[0] / b[0]];
  const d_ = [d[0] / b[0]];

  // Forward sweep -  
  for (let i = 1; i <= n; i++) {
    const denom = b[i] - a[i] * c_[i - 1];

    if (i < n) c_.push(c[i] / denom);

    d_.push((d[i] - a[i] * d_[i - 1]) / denom);
  }

  const x = Array(n).fill(0);
  x[n] = d_[n];

  for (let j = n - 1; j >= 0; j--) {
    x[j] = d_[j] - c_[j] * x[j + 1]
  }
  return x;
}


//------------------------------------------------------------------------------
// Test the solver.
//------------------------------------------------------------------------------

// Dot product two equal length ventors.
function dot(a, b) {
  console.assert(a.length === b.length, 'Length error: DOT');

  let c = 0;
  for (let i = 0; i < a.length; i++) {
    c += a[i] * b[i];
  }
  return c;
}

// Multiply a row-major matrix with a vector.
function mult(mat, vec) {
  console.assert(mat.length === vec.length);
  let out = [];
  for (let row = 0; row < mat.length; row++) {
    out.push(dot(mat[row], vec));
  }
  return out;
}

function test() {
  // A tridiagonal matrix
  const mat = [
    [1, 3, 0, 0],
    [4, 2, 5, 0],
    [0, 3, 1, 4],
    [0, 0, 6, 7],
  ];

  // The unknowns
  const vec = [4, 5, 6, 7];

  const product = mult(mat, vec);

  // Encode the matrix in the tridiagonal form.
  const A = [0, 4, 3, 6];
  const B = [1, 2, 1, 7];
  const C = [3, 5, 4, 0];
  const D = product;

  const X = solveTridiagonalMatrix(A, B, C, D);

  console.assert(X.length === vec.length);
  for (let i = 0; i < X.length; i++) {
    const diff = Math.abs(vec[i] - X[i]);
    console.assert(diff < 1e-6, `Expected ${vec[i]}, got ${X[i]}`);
  }
}

test();