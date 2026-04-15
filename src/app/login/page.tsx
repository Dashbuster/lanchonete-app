"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const callbackUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("callbackUrl") || "/admin/dashboard"
          : "/admin/dashboard"

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      })
      if (result?.error) {
        toast.error("Email ou senha invalidos.")
        return
      }
      toast.success("Login realizado com sucesso!")
      router.push(callbackUrl)
      router.refresh()
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center pt-16 sm:pt-0 px-4 pb-12">
      <div className="w-full max-w-md bg-dark-800 border border-dark-600 rounded-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-500">Big Night</h1>
          <p className="text-dark-400 text-sm mt-1">Acesso unico ao painel administrativo</p>
        </div>

        <div className="mb-6 rounded-lg border border-dark-600 bg-dark-700/60 p-4 text-sm text-dark-200">
          Use as credenciais do admin cadastrado no sistema. Se nao houver usuario no banco, o login usa
          `ADMIN_EMAIL` e `ADMIN_PASSWORD` como fallback.
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-dark-200">Email</label>
            <Input type="email" placeholder="admin@seudominio.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-dark-200">Senha</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full py-3" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <Link href="/" className="flex items-center justify-center gap-2 mt-6 text-dark-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao cardapio
        </Link>
      </div>
    </div>
  )
}
