import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttendanceFilter } from "@/components/admin/attendance-filter";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ cleaner?: string; period?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Get all cleaners for filter
  const { data: cleaners } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'cleaner')
    .order('full_name', { ascending: true });

  // Build query based on filters
  let query = supabase
    .from('attendance_logs')
    .select(`
      id,
      clock_in,
      clock_out,
      total_hours,
      status,
      notes,
      users:cleaner_id (full_name)
    `)
    .order('clock_in', { ascending: false });

  // Filter by cleaner if specified
  if (params.cleaner) {
    query = query.eq('cleaner_id', params.cleaner);
  }

  // Filter by period
  const now = new Date();
  if (params.period === 'today') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    query = query.gte('clock_in', today.toISOString());
  } else if (params.period === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    query = query.gte('clock_in', weekAgo.toISOString());
  } else if (params.period === 'month') {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    query = query.gte('clock_in', monthAgo.toISOString());
  }

  const { data: attendanceLogs } = await query;

  // Calculate total hours
  const totalHours = attendanceLogs?.reduce(
    (sum, log) => sum + (Number(log.total_hours) || 0),
    0
  ) || 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">
            Monitor cleaner attendance and work hours
          </p>
        </div>
      </div>

      <AttendanceFilter cleaners={cleaners || []} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceLogs?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Currently Working</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceLogs?.filter(log => log.status === 'clocked_in').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceLogs && attendanceLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Cleaner</th>
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Clock In</th>
                      <th className="text-left p-2 font-medium">Clock Out</th>
                      <th className="text-left p-2 font-medium">Total Hours</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{log.users?.full_name}</td>
                        <td className="p-2 text-sm">
                          {new Date(log.clock_in).toLocaleDateString()}
                        </td>
                        <td className="p-2 text-sm">
                          {new Date(log.clock_in).toLocaleTimeString()}
                        </td>
                        <td className="p-2 text-sm">
                          {log.clock_out 
                            ? new Date(log.clock_out).toLocaleTimeString()
                            : '-'
                          }
                        </td>
                        <td className="p-2 font-medium">
                          {log.total_hours 
                            ? `${Number(log.total_hours).toFixed(2)}h`
                            : '-'
                          }
                        </td>
                        <td className="p-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            log.status === 'clocked_out' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {log.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No attendance records found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
