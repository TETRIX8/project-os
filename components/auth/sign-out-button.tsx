"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button, type ButtonProps } from "@/components/ui/button"

export function SignOutButton(props: Omit<ButtonProps, "onClick">) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  return (
    <Button
      {...props}
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        await authClient.signOut()
        router.push("/login")
        router.refresh()
      }}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      Выйти
    </Button>
  )
}
