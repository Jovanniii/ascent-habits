/**
 * Contexte 2D factice pour les tests : chaque méthode est acceptée et comptée,
 * les dégradés et mesures de texte renvoient des objets minimaux. Il permet de
 * vérifier ce que la scène dessine sans navigateur.
 */
export interface FakeContext {
  ctx: CanvasRenderingContext2D
  calls: Map<string, number>
  /** Textes écrits dans la scène (étiquettes). */
  texts: string[]
  canvas: { width: number; height: number }
}

export function fakeContext(): FakeContext {
  const calls = new Map<string, number>()
  const texts: string[] = []
  const canvas = { width: 0, height: 0 }
  const gradient = { addColorStop: () => undefined }
  const state: Record<string | symbol, unknown> = {}
  const ctx = new Proxy(state, {
    get(target, prop) {
      if (prop === 'canvas') return canvas
      if (prop in target) return target[prop]
      return (...args: unknown[]) => {
        calls.set(String(prop), (calls.get(String(prop)) ?? 0) + 1)
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return gradient
        if (prop === 'measureText') return { width: String(args[0]).length * 6 }
        if (prop === 'createPattern') return {}
        if (prop === 'fillText') texts.push(String(args[0]))
        return undefined
      }
    },
    set(target, prop, value) {
      target[prop] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { ctx, calls, texts, canvas }
}
