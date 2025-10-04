import { Loader2Icon, BookOpenIcon, GraduationCapIcon, UsersIcon, HeartIcon, StarIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type SpinnerVariant = "default" | "dots" | "pulse" | "bounce" | "education" | "creative" | "parent"

interface SpinnerProps extends React.ComponentProps<"div"> {
  variant?: SpinnerVariant
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  textKey?: string
  fullPage?: boolean
}

import { useI18n } from "@/app/i18n/I18nProvider"

function Spinner({ 
  className, 
  variant = "default", 
  size = "md",
  text,
  textKey,
  fullPage = false,
  ...props 
}: SpinnerProps) {
  const { t } = useI18n();
  function getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }
  const displayText = textKey ? getNestedValue(t, textKey) ?? text : text;
  const sizeClasses = {
    sm: "size-4",
    md: "size-8", 
    lg: "size-12",
    xl: "size-16"
  }

  const containerClasses = fullPage 
    ? "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    : "flex items-center justify-center"

  if (variant === "default") {
    return (
      <div className={cn(containerClasses, "flex-col", className)} {...props}>
        <Loader2Icon
          role="status"
          aria-label="Loading"
          className={cn(sizeClasses[size], "animate-spin text-black")}
        />
        {displayText && (
          <div className="mt-2 text-center w-full">
            <span className={cn(
              "font-medium text-black animate-pulse block",
              size === "sm" ? "text-sm" : size === "md" ? "text-base" : size === "lg" ? "text-lg" : "text-xl"
            )}>{displayText}</span>
          </div>
        )}
      </div>
    )
  }

  if (variant === "dots") {
    return (
      <div className={cn(containerClasses, "flex-col", className)} {...props}>
        <div className="flex items-center justify-center space-x-1">
          <div className={cn("rounded-full bg-black animate-bounce", 
            size === "sm" ? "size-2" : size === "md" ? "size-3" : size === "lg" ? "size-4" : "size-5")} 
            style={{ animationDelay: "0ms" }} 
          />
          <div className={cn("rounded-full bg-black animate-bounce", 
            size === "sm" ? "size-2" : size === "md" ? "size-3" : size === "lg" ? "size-4" : "size-5")} 
            style={{ animationDelay: "150ms" }} 
          />
          <div className={cn("rounded-full bg-black animate-bounce", 
            size === "sm" ? "size-2" : size === "md" ? "size-3" : size === "lg" ? "size-4" : "size-5")} 
            style={{ animationDelay: "300ms" }} 
          />
        </div>
        {displayText && (
          <div className="mt-2 text-center w-full">
            <span className={cn(
              "text-black font-medium animate-pulse block",
              size === "sm" ? "text-sm" : size === "md" ? "text-base" : size === "lg" ? "text-lg" : "text-xl"
            )}>{displayText}</span>
          </div>
        )}
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className={cn(containerClasses, "flex-col", className)} {...props}>
        <div className={cn(
          "rounded-full bg-black animate-pulse opacity-75",
          sizeClasses[size]
        )} />
        {displayText && (
          <div className="mt-2 text-center w-full">
            <span className={cn(
              "text-black font-medium animate-pulse block",
              size === "sm" ? "text-sm" : size === "md" ? "text-base" : size === "lg" ? "text-lg" : "text-xl"
            )}>{displayText}</span>
          </div>
        )}
      </div>
    )
  }

  if (variant === "bounce") {
    return (
      <div className={cn(containerClasses, "flex-col", className)} {...props}>
        <div className={cn(
          "rounded-full  animate-bounce shadow-lg",
          sizeClasses[size]
        )} />
        {displayText && (
          <div className="mt-2 text-center w-full">
            <span className={cn(
              "text-black font-medium animate-pulse block",
              size === "sm" ? "text-sm" : size === "md" ? "text-base" : size === "lg" ? "text-lg" : "text-xl"
            )}>{displayText}</span>
          </div>
        )}
      </div>
    )
  }

  if (variant === "education") {
    return (
      <div className={cn(containerClasses, "flex-col", fullPage ? "" : "relative", className)} {...props}>
        <div className="relative">
          <BookOpenIcon 
            className={cn(sizeClasses[size], "text-primary animate-pulse")} 
          />
          <GraduationCapIcon 
            className={cn(
              "absolute -top-1 -right-1 text-primary/60 animate-bounce",
              size === "sm" ? "size-3" : size === "md" ? "size-4" : size === "lg" ? "size-6" : "size-8"
            )} 
            style={{ animationDelay: "200ms" }}
          />
        </div>
        {displayText && (
          <div className="mt-2 text-center w-full">
            <span className={cn(
              "text-black font-medium animate-pulse block",
              size === "sm" ? "text-sm" : size === "md" ? "text-base" : size === "lg" ? "text-lg" : "text-xl"
            )}>{displayText}</span>
          </div>
        )}
      </div>
    )
  }

  if (variant === "creative") {
    return (
      <div className={cn("flex flex-col items-center justify-center", containerClasses, className)} {...props}>
        <div className="relative">
          {/* Outer rotating ring */}
          <div className={cn(
            "border-4 border-primary/20 border-t-primary rounded-full animate-spin",
            sizeClasses[size]
          )} />
          
          {/* Inner pulsing dot */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center"
          )}>
            <div className={cn(
              "rounded-full bg-black animate-pulse",
              size === "sm" ? "size-1.5" : size === "md" ? "size-2" : size === "lg" ? "size-3" : "size-4"
            )} />
          </div>
          
          {/* Orbiting dots */}
          <div className={cn(
            "absolute inset-0 animate-spin",
            size === "sm" ? "animate-[spin_2s_linear_infinite]" : 
            size === "md" ? "animate-[spin_1.5s_linear_infinite]" :
            "animate-[spin_1s_linear_infinite]"
          )}>
            <div className={cn(
              "absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60",
              size === "sm" ? "size-1" : size === "md" ? "size-1.5" : size === "lg" ? "size-2" : "size-3"
            )} />
          </div>
        </div>
        {displayText && (
          <div className="mt-2 text-center w-full">
            <span className={cn(
              "text-black font-medium animate-pulse block",
              size === "sm" ? "text-sm" : size === "md" ? "text-base" : size === "lg" ? "text-lg" : "text-xl"
            )}>{displayText}</span>
          </div>
        )}
      </div>
    )
  }

  if (variant === "parent") {
    return (
      <div className={cn("flex flex-col items-center justify-center space-y-4 h-[100vh]", className)} {...props}>
        {/* Main animation container */}
        <div className="relative">
          {/* Parent and child figures */}
          <div className="relative flex items-center justify-center">
            <UsersIcon 
              className={cn(
                sizeClasses[size], 
                "text-primary animate-pulse"
              )} 
            />
            
            {/* Floating hearts */}
            <HeartIcon 
              className={cn(
                "absolute -top-2 -right-2 text-red-500 animate-bounce",
                size === "sm" ? "size-3" : size === "md" ? "size-4" : size === "lg" ? "size-5" : "size-6"
              )}
              style={{ animationDelay: "0ms" }}
            />
            
            <HeartIcon 
              className={cn(
                "absolute -bottom-1 -left-2 text-pink-400 animate-bounce",
                size === "sm" ? "size-2" : size === "md" ? "size-3" : size === "lg" ? "size-4" : "size-5"
              )}
              style={{ animationDelay: "400ms" }}
            />
            
            {/* Sparkle stars */}
            <StarIcon 
              className={cn(
                "absolute top-0 left-0 text-yellow-400 animate-ping",
                size === "sm" ? "size-2" : size === "md" ? "size-3" : size === "lg" ? "size-4" : "size-5"
              )}
              style={{ animationDelay: "200ms" }}
            />
            
            <StarIcon 
              className={cn(
                "absolute -bottom-2 right-0 text-amber-300 animate-ping",
                size === "sm" ? "size-1.5" : size === "md" ? "size-2" : size === "lg" ? "size-3" : "size-4"
              )}
              style={{ animationDelay: "600ms" }}
            />
          </div>
          
          {/* Rotating halo effect */}
          <div className={cn(
            "absolute inset-0 border-2 border-transparent border-t-primary/30 border-r-primary/30 rounded-full animate-spin",
            sizeClasses[size]
          )} style={{ animationDuration: "3s" }} />
          
          {/* Secondary rotating ring */}
          <div className={cn(
            "absolute inset-0 border border-transparent border-b-secondary/20 border-l-secondary/20 rounded-full animate-spin",
            sizeClasses[size]
          )} style={{ animationDuration: "2s", animationDirection: "reverse" }} />
        </div>
        
        {/* Loading text */}
        {text && (
          <div className="text-center space-y-1">
            <p className={cn(
              "text-black font-medium animate-pulse",
              size === "sm" ? "text-sm" : size === "md" ? "text-base" : size === "lg" ? "text-lg" : "text-xl"
            )}>
              {text}
            </p>
            <div className="flex items-center justify-center space-x-1">
              <div className="size-1 rounded-full bg-black/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="size-1 rounded-full bg-black/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="size-1 rounded-full bg-black/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

export { Spinner, type SpinnerProps }
