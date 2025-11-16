import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { CleanerSidebar } from "@/components/cleaner/cleaner-sidebar";
import { MobileNav } from "@/components/admin/mobile-nav";

export default async function CleanerLayout({
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
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'cleaner') {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block">
        <CleanerSidebar userName={userData.full_name} />
      </div>
      
      <div className="lg:hidden">
        <MobileNav role="cleaner" />
      </div>
      
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  );
}
