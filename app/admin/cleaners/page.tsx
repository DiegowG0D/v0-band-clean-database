import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from 'lucide-react';
import Link from "next/link";

export default async function CleanersPage() {
  const supabase = await createClient();

  const { data: cleaners, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      phone,
      created_at,
      cleaner_details!inner (
        id,
        hourly_rate,
        commission_rate,
        payment_type,
        fixed_hourly_rate,
        status,
        hire_date
      )
    `)
    .eq('role', 'cleaner')
    .order('created_at', { ascending: false });

  console.log('[v0] Cleaners query error:', error);
  console.log('[v0] Cleaners data:', cleaners);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Cleaners</h1>
          <p className="text-muted-foreground">
            Manage your cleaning staff and commission rates
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cleaners/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Cleaner
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Cleaners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cleaners && cleaners.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Email</th>
                        <th className="text-left p-2 font-medium">Phone</th>
                        <th className="text-left p-2 font-medium">Hourly Rate</th>
                        <th className="text-left p-2 font-medium">Payment</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-left p-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cleaners.map((cleaner: any) => {
                        const details = cleaner.cleaner_details;
                        const paymentDisplay = details?.payment_type === 'fixed_hourly'
                          ? `€${Number(details?.fixed_hourly_rate || 0).toFixed(2)}/hr`
                          : `${(Number(details?.commission_rate || 0.5333) * 100).toFixed(2)}%`;
                        
                        console.log('[v0] Cleaner:', cleaner.full_name, 'ID:', cleaner.id, 'Details:', details);
                        
                        return (
                          <tr key={cleaner.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{cleaner.full_name}</td>
                            <td className="p-2 text-sm text-muted-foreground">{cleaner.email}</td>
                            <td className="p-2 text-sm">{cleaner.phone || '-'}</td>
                            <td className="p-2">
                              {details?.hourly_rate 
                                ? `€${Number(details.hourly_rate).toFixed(2)}`
                                : '-'
                              }
                            </td>
                            <td className="p-2 text-sm">
                              <span className="font-medium text-green-600">
                                {paymentDisplay}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                details?.status === 'active' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                {details?.status || 'inactive'}
                              </span>
                            </td>
                            <td className="p-2">
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/admin/cleaners/${cleaner.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {cleaners.map((cleaner: any) => {
                    const details = cleaner.cleaner_details;
                    const paymentDisplay = details?.payment_type === 'fixed_hourly'
                      ? `€${Number(details?.fixed_hourly_rate || 0).toFixed(2)}/hr`
                      : `${(Number(details?.commission_rate || 0.5333) * 100).toFixed(2)}%`;
                    
                    return (
                      <Card key={cleaner.id}>
                        <CardContent className="pt-6 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{cleaner.full_name}</p>
                              <p className="text-sm text-muted-foreground">{cleaner.email}</p>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/admin/cleaners/${cleaner.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Phone</p>
                              <p className="font-medium">{cleaner.phone || '-'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Hourly Rate</p>
                              <p className="font-medium">
                                {details?.hourly_rate 
                                  ? `€${Number(details.hourly_rate).toFixed(2)}`
                                  : '-'
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                {details?.payment_type === 'fixed_hourly' ? 'Fixed Rate' : 'Commission'}
                              </p>
                              <p className="font-medium text-green-600">{paymentDisplay}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                details?.status === 'active' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                {details?.status || 'inactive'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No cleaners found. Add your first cleaner to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
