/**
 * Bruit pseudo-aléatoire déterministe pour dessiner les crêtes, la brume et les
 * petits détails de la scène « Cordée » (Doc 08). Fonctions pures : une même
 * entrée donne toujours le même résultat, d'une image à l'autre.
 */

/** Valeur pseudo-aléatoire stable entre 0 et 1 pour un entier et une graine. */
export function hash(index: number, seed: number): number {
  const x = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Bruit de valeur lissé, entre 0 et 1. */
export function valueNoise(x: number, seed: number): number {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return hash(i, seed) * (1 - u) + hash(i + 1, seed) * u
}

/** Somme de plusieurs octaves de bruit (relief doux), entre 0 et 1. */
export function fbm(x: number, seed: number, octaves = 4): number {
  let total = 0
  let amplitude = 0.5
  let frequency = 1
  let norm = 0
  for (let k = 0; k < octaves; k++) {
    total += amplitude * valueNoise(x * frequency, seed + k * 17)
    norm += amplitude
    amplitude *= 0.5
    frequency *= 2.03
  }
  return total / norm
}

/** Bruit « en arêtes » : des crêtes pointues comme une chaîne lointaine, entre 0 et 1. */
export function ridged(x: number, seed: number): number {
  let total = 0
  let amplitude = 0.55
  let frequency = 1
  let norm = 0
  for (let k = 0; k < 5; k++) {
    const v = 1 - Math.abs(2 * valueNoise(x * frequency, seed + k * 13) - 1)
    total += amplitude * v * v
    norm += amplitude
    amplitude *= 0.5
    frequency *= 2.1
  }
  return total / norm
}

/** Générateur pseudo-aléatoire reproductible (mulberry32), valeurs entre 0 et 1. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
