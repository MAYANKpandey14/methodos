
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  priority?: 'high' | 'medium' | 'low';
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, priority, ...props }, ref) => {
  const getPriorityColors = () => {
    switch (priority) {
      case 'high':
        return 'data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 data-[state=checked]:text-white';
      case 'medium':
        return 'data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500 data-[state=checked]:text-white';
      case 'low':
        return 'data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white';
      default:
        return 'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground';
    }
  };

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:scale-105",
        getPriorityColors(),
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current transition-all duration-200 ease-in-out")}
      >
        <Check className="h-3 w-3 animate-scale-in" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
