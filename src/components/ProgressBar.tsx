interface ProgressBarProps {
  progress: number // 0-100
  className?: string
}

export default function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={`w-full bg-neutral-900 rounded-full h-2.5 overflow-hidden ${className}`}>
      <div
        className="bg-gradient-to-r from-olive-500 to-olive-400 h-2.5 rounded-full transition-all duration-500 ease-out shadow-lg shadow-olive-500/30"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  )
}
