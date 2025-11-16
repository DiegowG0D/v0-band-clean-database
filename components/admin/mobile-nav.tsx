"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from 'next/navigation';
import Link from "next/link";
import { Menu, LayoutDashboard, Users, Calendar, Clock, DollarSign, LogOut, Settings, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';
import { NotificationBell } from '@/components/notifications/notification-bell';

interface MobileNavProps {
  role: 'admin' | 'cleaner';
}

export function MobileNav({ role }: MobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const adminNavItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/cleaners", icon: Users, label: "Cleaners" },
    { href: "/admin/customers", icon: UserCircle, label: "Customers" },
    { href: "/admin/bookings", icon: Calendar, label: "Bookings" },
    { href: "/admin/attendance", icon: Clock, label: "Attendance" },
    { href: "/admin/timesheet", icon: Clock, label: "Timesheet" },
    { href: "/admin/financials", icon: DollarSign, label: "Financials" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const cleanerNavItems = [
    { href: "/cleaner", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/cleaner/tasks", icon: Calendar, label: "My Tasks" },
    { href: "/cleaner/attendance", icon: Clock, label: "Attendance" },
  ];

  const navItems = role === 'admin' ? adminNavItems : cleanerNavItems;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b lg:hidden">
      <div className="flex items-center justify-between p-4">
        <div className="dark:bg-white dark:p-2 dark:rounded-lg">
          <Image 
            src="/logo-bandclean.png" 
            alt="Band Clean" 
            width={150}
            height={45}
            className="w-auto h-8 object-contain"
            priority
          />
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b flex flex-col gap-3">
                  <div className="dark:bg-white dark:p-3 dark:rounded-lg">
                    <Image 
                      src="/logo-bandclean.png" 
                      alt="Band Clean" 
                      width={200}
                      height={60}
                      className="w-auto h-12 object-contain"
                      priority
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {role === 'admin' ? 'Admin Panel' : 'Cleaner Panel'}
                  </p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className="w-full justify-start gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
