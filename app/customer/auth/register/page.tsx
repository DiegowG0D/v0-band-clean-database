"use client"

import { useState, Suspense } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

function CustomerRegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingFlow = searchParams.get("booking") === "true"
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Create user record with customer role
        const { error: userError } = await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          role: "customer",
        })

        if (userError) throw userError

        // Create customer details
        const { error: customerError } = await supabase.from("customer_details").insert({
          user_id: data.user.id,
          phone: phone || null,
        })

        if (customerError) throw customerError

        // Redirect based on flow
        if (bookingFlow) {
          router.push("/customer/bookings/new")
        } else {
          router.push("/customer/dashboard")
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to register")
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
        <CardTitle className="text-2xl text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          {bookingFlow 
            ? "Register to book your cleaning service"
            : "Join Band Clean as a customer"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bookingFlow && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-900">
              Create an account to proceed with your booking.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
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
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+356 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link 
              href={`/customer/auth/login${bookingFlow ? "?booking=true" : ""}`}
              className="text-blue-600 hover:underline font-medium"
            >
              Login here
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

export default function CustomerRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <Suspense fallback={
          <div className="animate-pulse flex flex-col items-center gap-4 p-8">
            <div className="h-12 w-12 rounded-full bg-blue-200" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        }>
          <CustomerRegisterForm />
        </Suspense>
      </Card>
    </div>
  )
}
