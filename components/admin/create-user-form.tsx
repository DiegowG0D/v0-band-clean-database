"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from 'lucide-react';

export function CreateUserForm() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"admin" | "cleaner">("cleaner");
  const [tempPassword, setTempPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const generatePassword = () => {
    const password = Math.random().toString(36).slice(-10) + "A1!";
    setTempPassword(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!tempPassword) {
      setError("Please generate a temporary password");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Update the user role if admin (default is cleaner from trigger)
      if (role === "admin") {
        const { error: updateError } = await supabase
          .from("users")
          .update({ role: "admin" })
          .eq("id", authData.user.id);

        if (updateError) throw updateError;

        // Delete cleaner_details if admin
        await supabase
          .from("cleaner_details")
          .delete()
          .eq("user_id", authData.user.id);
      }

      setSuccess(
        `User created successfully! Temporary password: ${tempPassword}. Please share this with the user securely.`
      );

      setTimeout(() => {
        router.push("/admin/users");
      }, 3000);
    } catch (error: unknown) {
      console.error("Create user error:", error);
      setError(
        error instanceof Error ? error.message : "An error occurred while creating the user"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="user@bandclean.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+351 912 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={role}
            onValueChange={(value: "admin" | "cleaner") => setRole(value)}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cleaner">Cleaner</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Only administrators can create new admin accounts
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tempPassword">Temporary Password</Label>
          <div className="flex gap-2">
            <Input
              id="tempPassword"
              type="text"
              placeholder="Click generate to create password"
              required
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={generatePassword}>
              Generate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            User should change this password after first login
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating User..." : "Create User"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/users")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
