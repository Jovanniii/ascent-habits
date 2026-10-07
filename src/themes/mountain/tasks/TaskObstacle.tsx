/**
 * Obstacle provisoire d'une tâche à faire, posé sur un tronçon de sentier.
 * Purement décoratif (aria-hidden) : la case à cocher et son libellé restent
 * ceux de l'interface. Une tâche en retard n'est jamais dessinée différemment.
 */
import type { TaskIllustrationProps } from '../../types.ts'
import { obstacleVariant, type ObstacleVariant } from './obstacles.ts'

export const OBSTACLE_WIDTH = 56
export const OBSTACLE_HEIGHT = 44

function Obstacle({ variant }: { variant: ObstacleVariant }) {
  switch (variant) {
    case 'rock':
      return (
        <g className="task-obstacle__shape">
          <path d="M16 36 Q15 26 23 22 Q30 17 37 22 Q43 26 41 36 Z" className="task-obstacle__rock" />
          <path d="M24 25 Q29 22 33 24" className="task-obstacle__detail" />
        </g>
      )
    case 'low-cloud':
      return (
        <g className="task-obstacle__shape">
          <path
            d="M10 30 Q10 24 16 24 Q18 17 26 18 Q31 13 37 18 Q45 17 46 24 Q51 25 50 30 Q50 33 46 33 L14 33 Q10 33 10 30 Z"
            className="task-obstacle__cloud"
          />
        </g>
      )
    case 'branch':
      return (
        <g className="task-obstacle__shape">
          <path d="M8 31 Q28 25 49 29" className="task-obstacle__wood" />
          <path d="M22 28 Q25 21 30 19" className="task-obstacle__twig" />
          <path d="M36 28 Q41 24 44 23" className="task-obstacle__twig" />
          <ellipse cx="31" cy="18" rx="3.4" ry="2" className="task-obstacle__leaf" />
          <ellipse cx="45" cy="22" rx="3" ry="1.8" className="task-obstacle__leaf" />
        </g>
      )
    case 'scree':
      return (
        <g className="task-obstacle__shape">
          <circle cx="20" cy="33" r="4.5" className="task-obstacle__rock" />
          <circle cx="30" cy="32" r="5.5" className="task-obstacle__rock" />
          <circle cx="39" cy="34" r="3.6" className="task-obstacle__rock" />
          <circle cx="26" cy="26" r="3.4" className="task-obstacle__rock" />
          <circle cx="34" cy="25.5" r="2.6" className="task-obstacle__rock" />
        </g>
      )
  }
}

export function TaskObstacle({ taskId, clearing, motionAllowed }: TaskIllustrationProps) {
  const variant = obstacleVariant(taskId)
  return (
    <svg
      className="task-obstacle"
      viewBox={`0 0 ${OBSTACLE_WIDTH} ${OBSTACLE_HEIGHT}`}
      aria-hidden="true"
      focusable="false"
      data-variant={variant}
      data-clearing={clearing ? 'true' : 'false'}
      data-motion={motionAllowed ? 'on' : 'off'}
    >
      <rect x="0" y="0" width={OBSTACLE_WIDTH} height={OBSTACLE_HEIGHT} rx="10" className="task-obstacle__sky" />
      <path d="M0 40 Q14 34 28 36 Q42 38 56 32 L56 44 L0 44 Z" className="task-obstacle__ground" />
      <path d="M2 41 Q16 36 28 37.5 Q42 39 54 34" className="task-obstacle__trail" />
      <Obstacle variant={variant} />
    </svg>
  )
}
