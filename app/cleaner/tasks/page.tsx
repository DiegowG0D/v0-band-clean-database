import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: allBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      status,
      duration_hours,
      customers (name, address, phone),
      services (name, description)
    `)
    .eq('cleaner_id', user.id)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground">
          View all your assigned cleaning tasks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {allBookings && allBookings.length > 0 ? (
              allBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {booking.services?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {booking.services?.description}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      booking.status === 'confirmed' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Date & Time</p>
                      <p className="font-medium">
                        {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{booking.duration_hours} hours</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium">{booking.customers?.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{booking.customers?.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Address</p>
                    <p className="font-medium">{booking.customers?.address}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No tasks assigned yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
