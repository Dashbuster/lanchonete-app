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
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Login realizado com sucesso!")
      router.push("/admin/dashboard")
      router.refresh()
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar conta")
        return
      }
      toast.success("Conta criada! Fazendo login...")
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        toast.error("Conta criada mas erro no login automatico.")
        setIsLogin(true)
        return
      }
      router.push("/admin/dashboard")
      router.refresh()
    } catch {
      toast.error("Erro ao criar conta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center pt-16 sm:pt-0 px-4 pb-12">
      <div className="w-full max-w-md bg-dark-800 border border-dark-600 rounded-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-500">Lanchonete</h1>
          <p className="text-dark-400 text-sm mt-1">Acesso ao painel administrativo</p>
        </div>

        <div className="flex mb-6 bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              isLogin ? "bg-brand-500 text-white" : "text-dark-300"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              !isLogin ? "bg-brand-500 text-white" : "text-dark-300"
            }`}
          >
            Criar Conta
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-dark-200">Email</label>
              <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-dark-200">Nome</label>
              <Input type="text" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-dark-200">Email</label>
              <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-dark-200">Senha</label>
              <Input type="password" placeholder="Minimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <Button type="submit" variant="primary" className="w-full py-3" disabled={loading}>
              {loading ? "Criando..." : "Criar Conta"}
            </Button>
          </form>
        )}

        <Link href="/" className="flex items-center justify-center gap-2 mt-6 text-dark-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao cardapio
        </Link>
      </div>
    </div>
  )
}
