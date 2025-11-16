import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileNav } from "@/components/admin/mobile-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin') {
    redirect("/cleaner");
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      
      <div className="lg:hidden">
        <MobileNav role="admin" />
      </div>
      
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  );
}
