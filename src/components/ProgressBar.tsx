interface ProgressBarProps {
  progress: number // 0-100
  className?: string
}

export default function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={`w-full bg-gray-700 rounded-full h-2.5 ${className}`}>
      <div
        className="bg-olive-500 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  )
}
