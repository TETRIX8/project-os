"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { markNotificationsRead } from "@/app/actions/student"
import { Button } from "@/components/ui/button"

export function MarkReadButton() {
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await markNotificationsRead()
          if (res.ok) router.refresh()
          else toast.error(res.error)
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <CheckCheck />}
      Прочитать все
    </Button>
  )
}
