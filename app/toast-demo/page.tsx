"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ToastDemo() {
  const { toast } = useToast()

  const showSuccess = () => {
    toast({
      variant: "success",
      title: "Message Sent",
      description: "Your message has been sent. We'll get back to you soon.",
    })
  }

  const showError = () => {
    toast({
      variant: "error",
      title: "Error Occurred",
      description: "Sorry, please try again later.",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => alert("Retrying...")}
        >
          Try again
        </Button>
      ),
    })
  }

  const showWarning = () => {
    toast({
      variant: "warning",
      title: "Your subscription is about to expire in 3 days.",
      description: "Renew now to avoid any service interruptions.",
    })
  }

  const showInfo = () => {
    toast({
      variant: "info",
      title: "Attention",
      description: "Our website will be undergoing scheduled maintenance tonight from 10 PM to 2 AM.",
    })
  }

  const showDefault = () => {
    toast({
      variant: "default",
      title: "Default Toast",
      description: "This is a default notification.",
    })
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Toast Notifications Demo</CardTitle>
          <CardDescription>
            Click the buttons below to see different toast notification styles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={showSuccess}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Show Success Toast
            </Button>
            
            <Button 
              onClick={showError}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Show Error Toast
            </Button>
            
            <Button 
              onClick={showWarning}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Show Warning Toast
            </Button>
            
            <Button 
              onClick={showInfo}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Show Info Toast
            </Button>
            
            <Button 
              onClick={showDefault}
              variant="outline"
              className="col-span-full"
            >
              Show Default Toast
            </Button>
          </div>

          <div className="mt-8 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">Toast Variants:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• <strong>Success</strong> - Green with checkmark icon</li>
              <li>• <strong>Error</strong> - Red with X icon (supports action button)</li>
              <li>• <strong>Warning</strong> - Yellow/Amber with alert triangle icon</li>
              <li>• <strong>Info</strong> - Blue with info icon</li>
              <li>• <strong>Default</strong> - Gray with info icon</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
