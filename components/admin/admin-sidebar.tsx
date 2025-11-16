"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from 'next/navigation';
import Link from "next/link";
import { LayoutDashboard, Users, Calendar, Clock, DollarSign, LogOut, Settings, UserCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';
import { NotificationBell } from '@/components/notifications/notification-bell';

export function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const navItems = [
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

  return (
    <div className="w-64 border-r bg-card flex flex-col">
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
        <p className="text-sm text-muted-foreground">Admin Panel</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
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
      <div className="p-4 border-t space-y-2">
        <div className="flex justify-center gap-2">
          <NotificationBell />
          <ThemeToggle />
        </div>
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
  );
}
