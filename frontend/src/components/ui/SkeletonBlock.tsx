interface SkeletonBlockProps {
  width?: string
  height: string
  rounded?: string
}

export default function SkeletonBlock({ width = '100%', height, rounded = '4px' }: SkeletonBlockProps) {
  return (
    <div
      className="animate-pulse bg-[#F1F5F9]"
      style={{ width, height, borderRadius: rounded }}
      aria-hidden="true"
      data-testid="skeleton-block"
    />
  )
}
