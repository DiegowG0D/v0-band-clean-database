import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-6xl font-bold">Band Clean</h1>
        <p className="text-xl text-muted-foreground">
          Professional Cleaning Management System
        </p>
        <p className="text-muted-foreground">
          Streamline your cleaning business operations with our comprehensive management platform.
          Track bookings, manage staff, and monitor performance all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
