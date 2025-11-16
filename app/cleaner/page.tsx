import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { BookingClockButton } from "@/components/cleaner/booking-clock-button";

export default async function CleanerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get today's bookings
  const today = new Date().toISOString().split('T')[0];
  const { data: todayBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      duration_hours,
      status,
      customers (name, address, phone),
      services (name)
    `)
    .eq('cleaner_id', user.id)
    .eq('scheduled_date', today)
    .order('scheduled_time', { ascending: true });

  const bookingsWithAttendance = await Promise.all(
    (todayBookings || []).map(async (booking) => {
      const { data: attendance } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('booking_id', booking.id)
        .eq('cleaner_id', user.id)
        .order('clock_in', { ascending: false })
        .limit(1)
        .single();
      
      return {
        ...booking,
        attendance,
      };
    })
  );

  // Get upcoming bookings
  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      status,
      customers (name),
      services (name)
    `)
    .eq('cleaner_id', user.id)
    .gt('scheduled_date', today)
    .order('scheduled_date', { ascending: true })
    .limit(5);

  // Check if currently clocked in
  const { data: activeAttendance } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('cleaner_id', user.id)
    .eq('status', 'clocked_in')
    .single();

  // Get this week's total hours
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const { data: weekAttendance } = await supabase
    .from('attendance_logs')
    .select('total_hours')
    .eq('cleaner_id', user.id)
    .gte('clock_in', startOfWeek.toISOString());

  const totalWeekHours = weekAttendance?.reduce((sum, log) => sum + (Number(log.total_hours) || 0), 0) || 0;

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pt-20 lg:pt-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Welcome back! Here&apos;s your schedule for today.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Tasks
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBookings?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Hours This Week
            </CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWeekHours.toFixed(1)}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Status
            </CardTitle>
            <CheckCircle className={`h-4 w-4 ${activeAttendance ? 'text-green-600' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {activeAttendance ? 'Clocked In' : 'Clocked Out'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Today&apos;s Schedule</CardTitle>
          <p className="text-sm text-muted-foreground">Clock in and out for each appointment</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bookingsWithAttendance && bookingsWithAttendance.length > 0 ? (
              bookingsWithAttendance.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col gap-4 border rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <p className="font-medium text-lg">
                          {booking.scheduled_time} ({booking.duration_hours}h estimated)
                        </p>
                      </div>
                      <p className="text-base font-semibold">
                        {booking.customers?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.customers?.address}
                      </p>
                      {booking.customers?.phone && (
                        <p className="text-sm text-muted-foreground">
                          📞 {booking.customers.phone}
                        </p>
                      )}
                      <p className="text-sm font-medium text-primary">
                        {booking.services?.name}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium self-start ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      booking.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <BookingClockButton 
                    bookingId={booking.id}
                    attendance={booking.attendance}
                    cleanerId={user.id}
                    estimatedHours={booking.duration_hours}
                    scheduledDateTime={`${booking.scheduled_date}T${booking.scheduled_time}`}
                  />
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No tasks scheduled for today
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingBookings && upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.customers?.name}
                    </p>
                    <p className="text-sm font-medium">
                      {booking.services?.name}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No upcoming bookings
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
