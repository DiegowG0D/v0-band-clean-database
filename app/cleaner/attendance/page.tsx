import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: attendanceLogs } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('cleaner_id', user.id)
    .order('clock_in', { ascending: false })
    .limit(30);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance History</h1>
        <p className="text-muted-foreground">
          View your clock in/out history
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceLogs && attendanceLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Clock In</th>
                      <th className="text-left p-2 font-medium">Clock Out</th>
                      <th className="text-left p-2 font-medium">Total Hours</th>
                      <th className="text-left p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          {new Date(log.clock_in).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          {new Date(log.clock_in).toLocaleTimeString()}
                        </td>
                        <td className="p-2">
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
