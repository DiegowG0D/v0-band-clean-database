"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const supabase = createClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (userData?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/cleaner');
        }
      } else {
        router.push('/auth/login');
      }
    };

    handleEmailConfirmation();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Confirming your email...</h1>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
}
