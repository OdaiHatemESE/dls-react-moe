"use client"

import { toast } from "./use-toast"

/**
 * Enhanced toast notifications with predefined styles for common use cases
 */
export function useToastNotifications() {
  const success = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "success",
    })
  }

  const error = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "error",
    })
  }

  const warning = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "warning",
    })
  }

  const info = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "info",
    })
  }

  const loading = (title: string, description?: string) => {
    return toast({
      title,
      description,
      duration: Infinity, // Won't auto-dismiss
      variant: "info",
    })
  }

  return {
    success,
    error,
    warning,
    info,
    loading,
    toast, // Still expose the raw toast for custom usage
  }
}
