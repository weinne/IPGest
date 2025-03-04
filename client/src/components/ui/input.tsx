import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(
  (props, ref) => {
    return (
      <input
        ref={ref}
        defaultValue="" // Garante que o input seja controlado desde o início
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          props.className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
