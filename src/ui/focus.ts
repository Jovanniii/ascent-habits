/**
 * Prépare le déplacement du focus avant qu'un élément de liste ne disparaisse
 * (tâche cochée qui change de liste, par exemple). Renvoie la fonction à appeler
 * après la mise à jour : le focus va à l'élément voisin, sinon au titre de la
 * liste, sinon au titre de l'écran.
 */
export function prepareFocusAfterRemoval(from: HTMLElement | null): () => void {
  const item = from?.closest('li')
  const candidates = [
    item?.nextElementSibling?.querySelector<HTMLElement>('input, button'),
    item?.previousElementSibling?.querySelector<HTMLElement>('input, button'),
    item?.closest('details')?.querySelector<HTMLElement>('summary'),
    item?.closest('section')?.querySelector<HTMLElement>('h2'),
  ]
  return () => {
    // Après le rendu : on ne garde que les éléments encore présents dans la page.
    setTimeout(() => {
      if (from?.isConnected && document.activeElement === from) return
      const target =
        candidates.find((candidate) => candidate?.isConnected) ?? document.querySelector<HTMLElement>('main h1')
      target?.focus({ preventScroll: true })
    }, 0)
  }
}

/** Donne le focus à la case d'une tâche après le rendu (ex. tâche restaurée). */
export function focusTask(taskId: string): void {
  setTimeout(() => {
    const item = [...document.querySelectorAll<HTMLElement>('[data-task-id]')].find(
      (element) => element.dataset.taskId === taskId,
    )
    item?.querySelector<HTMLElement>('input')?.focus({ preventScroll: true })
  }, 0)
}
