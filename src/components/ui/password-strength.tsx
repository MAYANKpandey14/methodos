import * as React from "react"
import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
  className?: string
}

const getPasswordStrength = (password: string) => {
  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }

  Object.values(checks).forEach(check => {
    if (check) score++
  })

  if (score <= 2) return { strength: 'weak', color: 'bg-destructive', text: 'Weak' }
  if (score <= 3) return { strength: 'medium', color: 'bg-yellow-500', text: 'Medium' }
  if (score <= 4) return { strength: 'good', color: 'bg-blue-500', text: 'Good' }
  return { strength: 'strong', color: 'bg-green-500', text: 'Strong' }
}

const PasswordStrength = React.forwardRef<HTMLDivElement, PasswordStrengthProps>(
  ({ password, className }, ref) => {
    if (!password) return null

    const { strength, color, text } = getPasswordStrength(password)
    const strengthPercent = {
      weak: 25,
      medium: 50,
      good: 75,
      strong: 100
    }[strength]

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            strength === 'weak' && "text-destructive",
            strength === 'medium' && "text-yellow-600",
            strength === 'good' && "text-blue-600",
            strength === 'strong' && "text-green-600"
          )}>
            {text}
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", color)}
            style={{ width: `${strengthPercent}%` }}
          />
        </div>
      </div>
    )
  }
)
PasswordStrength.displayName = "PasswordStrength"

export { PasswordStrength }