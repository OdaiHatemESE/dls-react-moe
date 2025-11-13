"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle2, AlertCircle, AlertTriangle, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 pr-10 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-50",
        error:
          "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-50",
        warning:
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50",
        info:
          "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const iconVariants = cva(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        success: "bg-emerald-500 text-white",
        error: "bg-red-500 text-white",
        warning: "bg-amber-500 text-white",
        info: "bg-blue-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const getToastIcon = (variant?: "default" | "success" | "error" | "warning" | "info") => {
  switch (variant) {
    case "success":
      return CheckCircle2
    case "error":
      return XCircle
    case "warning":
      return AlertTriangle
    case "info":
      return AlertCircle
    default:
      return AlertCircle
  }
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants> & {
      showIcon?: boolean
    }
>(({ className, variant, showIcon = true, children, ...props }, ref) => {
  const Icon = getToastIcon(variant ?? undefined)
  
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {showIcon && (
        <div className={cn(iconVariants({ variant }))}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1">{children}</div>
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "mt-2 inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-current px-4 text-sm font-medium transition-colors hover:bg-current/10 focus:outline-none focus:ring-2 focus:ring-current/20 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-md p-1 text-current/40 opacity-70 transition-all hover:opacity-100 hover:bg-current/10 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-current/20",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("mt-1 text-sm leading-relaxed opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
