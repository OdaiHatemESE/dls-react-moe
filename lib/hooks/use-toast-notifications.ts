"use client"

import { toast } from "./use-toast"
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react"

/**
 * Enhanced toast notifications with predefined styles for common use cases
 */
export function useToastNotifications() {
  const success = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "default",
      className: "border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100",
    })
  }

  const error = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "destructive",
    })
  }

  const warning = (title: string, description?: string) => {
    return toast({
      title,
      description,
      className: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100",
    })
  }

  const info = (title: string, description?: string) => {
    return toast({
      title,
      description,
      className: "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100",
    })
  }

  const loading = (title: string, description?: string) => {
    return toast({
      title,
      description,
      duration: Infinity, // Won't auto-dismiss
      className: "border-gray-500 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100",
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
