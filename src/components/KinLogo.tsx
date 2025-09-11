import Image from 'next/image'

interface KinLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function KinLogo({ className = '', size = 'md' }: KinLogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <Image
        src="/kin-logo.png"
        alt="Kin Canada Logo"
        width={100}
        height={100}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}
