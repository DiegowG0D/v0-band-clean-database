'use client';

import { useEffect, useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Booking = {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  total_price: number;
  customers: { name: string } | null;
  services: { name: string } | null;
};

export default function AdminDashboardPage() {
  const [totalCleaners, setTotalCleaners] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([]);
  const [periodFilter, setPeriodFilter] = useState('month');
  const [churnRate, setChurnRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      // Fetch KPIs
      const { count: cleanersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'cleaner');

      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      const { count: pendingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { data: completedBookingsData } = await supabase
        .from('bookings')
        .select('total_price, cleaner_earnings, company_earnings')
        .eq('status', 'completed');

      const revenue = completedBookingsData?.reduce((sum, booking) => 
        sum + Number(booking.total_price || 0), 0
      ) || 0;

      // Fetch recent bookings
      const { data: recentData } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          status,
          total_price,
          customers (name),
          services (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate date range based on filter
      const now = new Date();
      let startDate = new Date();
      
      if (periodFilter === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (periodFilter === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (periodFilter === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // Fetch completed bookings for selected period
      const { data: completedData } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          status,
          total_price,
          customers (name),
          services (name),
          created_at
        `)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Fetch cancelled bookings for selected period
      const { data: cancelledData } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          status,
          total_price,
          customers (name),
          services (name),
          created_at
        `)
        .eq('status', 'cancelled')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Calculate churn rate (cancelled / total bookings in period)
      const totalPeriodBookings = (completedData?.length || 0) + (cancelledData?.length || 0);
      const churn = totalPeriodBookings > 0 
        ? ((cancelledData?.length || 0) / totalPeriodBookings) * 100 
        : 0;

      setTotalCleaners(cleanersCount || 0);
      setTotalBookings(bookingsCount || 0);
      setPendingBookings(pendingCount || 0);
      setTotalRevenue(revenue);
      setRecentBookings(recentData || []);
      setCompletedBookings(completedData || []);
      setCancelledBookings(cancelledData || []);
      setChurnRate(churn);
      setLoading(false);
    }

    fetchData();
  }, [periodFilter]);

  const kpis = [
    {
      title: "Total Cleaners",
      value: totalCleaners,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Bookings",
      value: totalBookings,
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Pending Bookings",
      value: pendingBookings,
      icon: TrendingUp,
      color: "text-orange-600",
    },
    {
      title: "Total Revenue",
      value: `€${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-purple-600",
    },
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-8 pt-20 lg:pt-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pt-20 lg:pt-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Welcome back! Here&apos;s an overview of your business.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg md:text-xl">Recent Bookings</CardTitle>
          <Link href="/admin/bookings">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              View All Bookings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBookings && recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {booking.customers?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.services?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:text-right space-y-1">
                    <p className="font-semibold">€{Number(booking.total_price).toFixed(2)}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No bookings yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg md:text-xl">Bookings Analytics</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track completed and cancelled bookings
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Churn Rate:</span>
              <span className={`text-lg font-bold ${churnRate > 20 ? 'text-red-600' : churnRate > 10 ? 'text-orange-600' : 'text-green-600'}`}>
                {churnRate.toFixed(1)}%
              </span>
            </div>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Completed Bookings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-lg">Completed ({completedBookings.length})</h3>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {completedBookings.length > 0 ? (
                  completedBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-sm">{booking.customers?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.scheduled_date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        €{Number(booking.total_price).toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No completed bookings in this period
                  </p>
                )}
              </div>
            </div>

            {/* Cancelled Bookings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-lg">Cancelled ({cancelledBookings.length})</h3>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {cancelledBookings.length > 0 ? (
                  cancelledBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-sm">{booking.customers?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.scheduled_date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold text-red-700 dark:text-red-400">
                        €{Number(booking.total_price).toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No cancelled bookings in this period
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
