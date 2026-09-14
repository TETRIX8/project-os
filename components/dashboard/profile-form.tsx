"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateProfile } from "@/app/actions/student"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfileForm({ name: initialName, email }: { name: string; email: string }) {
  const [name, setName] = useState(initialName)
  const [pending, start] = useTransition()
  const router = useRouter()

  return (
    <form
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await updateProfile({ name })
          if (res.ok) {
            toast.success("Профиль обновлён")
            router.refresh()
          } else toast.error(res.error)
        })
      }}
    >
      <h2 className="font-semibold">Личные данные</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Имя и фамилия</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled readOnly />
          <p className="text-xs text-muted-foreground">Изменение email — через поддержку.</p>
        </div>
      </div>
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" disabled={pending || name.trim() === initialName}>
          {pending && <Loader2 className="animate-spin" />}
          Сохранить
        </Button>
      </div>
    </form>
  )
}
