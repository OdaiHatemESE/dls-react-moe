/**
 * Global API response handler with toast notifications
 * Use this to handle API responses consistently across the application
 */

import { toast } from "@/lib/hooks/use-toast"

type ToastVariant = "default" | "success" | "error" | "warning" | "info"

interface ToastConfig {
  successTitle?: string
  successDescription?: string
  errorTitle?: string
  errorDescription?: string
  warningTitle?: string
  warningDescription?: string
}

interface ApiResponse {
  ok: boolean
  status: number
  statusText: string
  json: () => Promise<any>
}

/**
 * Handle API response with automatic toast notifications
 * @param response - Fetch Response object
 * @param config - Toast configuration for success/error messages
 * @returns Parsed JSON response data
 */
export async function handleApiResponse<T = any>(
  response: Response,
  config?: ToastConfig
): Promise<T> {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || response.statusText

    toast({
      title: config?.errorTitle || "Error",
      description: config?.errorDescription || errorMessage,
      variant: "error",
    })

    throw new Error(errorMessage)
  }

  if (config?.successTitle) {
    toast({
      title: config.successTitle,
      description: config.successDescription,
      variant: "success",
    })
  }

  return data
}

/**
 * Wrapper for fetch with automatic toast error handling
 * @param url - Request URL
 * @param options - Fetch options
 * @param toastConfig - Toast configuration
 */
export async function fetchWithToast<T = any>(
  url: string,
  options?: RequestInit,
  toastConfig?: ToastConfig
): Promise<T> {
  try {
    const response = await fetch(url, options)
    return await handleApiResponse<T>(response, toastConfig)
  } catch (error) {
    // Error already handled and toasted by handleApiResponse
    throw error
  }
}

/**
 * Show a loading toast that can be updated or dismissed
 * Useful for long-running operations
 */
export function showLoadingToast(message: string) {
  return toast({
    title: message,
    duration: Infinity,
    variant: "info",
  })
}

/**
 * Show success toast
 */
export function showSuccessToast(title: string, description?: string) {
  return toast({
    title,
    description,
    variant: "success",
  })
}

/**
 * Show error toast
 */
export function showErrorToast(title: string, description?: string) {
  return toast({
    title,
    description,
    variant: "error",
  })
}

/**
 * Show warning toast
 */
export function showWarningToast(title: string, description?: string) {
  return toast({
    title,
    description,
    variant: "warning",
  })
}

/**
 * Show info toast
 */
export function showInfoToast(title: string, description?: string) {
  return toast({
    title,
    description,
    variant: "info",
  })
}
