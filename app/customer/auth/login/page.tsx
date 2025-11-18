"use client"

import { useState, useEffect, Suspense } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

function CustomerLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingFlow = searchParams.get("booking") === "true"
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if user has customer role
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (userData?.role !== "customer") {
        setError("This login is for customers only. Please use the appropriate login page.")
        await supabase.auth.signOut()
        return
      }

      // Redirect to booking page if coming from booking flow
      if (bookingFlow) {
        router.push("/customer/bookings/new")
      } else {
        router.push("/customer/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-full bg-blue-600" />
          <span className="text-2xl font-bold">Band Clean</span>
        </div>
        <CardTitle className="text-2xl text-center">Customer Login</CardTitle>
        <CardDescription className="text-center">
          {bookingFlow 
            ? "Please login or register to book a cleaning service"
            : "Access your customer dashboard"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bookingFlow && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-900">
              You need to login or create an account to book a cleaning service.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link 
              href={`/customer/auth/register${bookingFlow ? "?booking=true" : ""}`}
              className="text-blue-600 hover:underline font-medium"
            >
              Register here
            </Link>
          </p>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 block">
            ← Back to home
          </Link>
        </div>
      </CardContent>
    </div>
  )
}

export default function CustomerLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <Suspense fallback={
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-200" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        }>
          <CustomerLoginForm />
        </Suspense>
      </Card>
    </div>
  )
}
