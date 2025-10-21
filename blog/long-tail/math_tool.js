// === Math helpers ===
export function cholesky2x2(cov) {
    const [[a, b], [c, d]] = cov;
    const L11 = Math.sqrt(a);
    const L21 = c / L11;
    const L22 = Math.sqrt(d - L21*L21);
    return [[L11, 0], [L21, L22]];
}

// Gaussian random using Box-Muller
export function randn_bm() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Quantile
export function quantile(arr, q) {
    const sorted = arr.slice().sort((a,b)=>a-b);
    const pos = (sorted.length+1) * q-1;
    const base = Math.floor(pos);
    if (pos < 0) {
        return 0;
    } else {
        return sorted[base];
    }
}
