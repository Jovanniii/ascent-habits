interface Props {
  /** Entre 0 et 100. */
  percent: number
  label: string
}

export function ProgressBar({ percent, label }: Props) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="progress__fill" style={{ width: `${percent}%` }} />
    </div>
  )
}
