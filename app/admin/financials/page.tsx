import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';

export default async function FinancialsPage() {
  const supabase = await createClient();

  // Get payment statistics
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount, payment_status, payment_method, created_at');

  const completedPayments = allPayments?.filter(p => p.payment_status === 'completed') || [];
  const pendingPayments = allPayments?.filter(p => p.payment_status === 'pending') || [];
  
  const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingRevenue = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Calculate this month's revenue
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthPayments = completedPayments.filter(
    p => new Date(p.created_at) >= firstDayOfMonth
  );
  const monthRevenue = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Get recent payments with booking details
  const { data: recentPayments } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      payment_method,
      payment_status,
      payment_date,
      created_at,
      bookings (
        scheduled_date,
        customers (name),
        services (name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  // Payment method breakdown
  const paymentMethodBreakdown = completedPayments.reduce((acc, payment) => {
    const method = payment.payment_method;
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 };
    }
    acc[method].count += 1;
    acc[method].total += Number(payment.amount);
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">
          Track payments, revenue, and financial metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {completedPayments.length} completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{monthRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {monthPayments.length} payments this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{pendingRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments.length} pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allPayments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(paymentMethodBreakdown).length > 0 ? (
                Object.entries(paymentMethodBreakdown).map(([method, data]) => (
                  <div key={method} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">
                        {method.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {data.count} payments
                      </p>
                    </div>
                    <p className="text-lg font-bold">€{data.total.toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No payment data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {completedPayments.length} payments
                  </p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  €{totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pending</p>
                  <p className="text-sm text-muted-foreground">
                    {pendingPayments.length} payments
                  </p>
                </div>
                <p className="text-lg font-bold text-orange-600">
                  €{pendingRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPayments && recentPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Customer</th>
                      <th className="text-left p-2 font-medium">Service</th>
                      <th className="text-left p-2 font-medium">Method</th>
                      <th className="text-left p-2 font-medium">Amount</th>
                      <th className="text-left p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 text-sm">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-2 text-sm">
                          {payment.bookings?.customers?.name || '-'}
                        </td>
                        <td className="p-2 text-sm">
                          {payment.bookings?.services?.name || '-'}
                        </td>
                        <td className="p-2 text-sm capitalize">
                          {payment.payment_method.replace('_', ' ')}
                        </td>
                        <td className="p-2 font-medium">
                          €{Number(payment.amount).toFixed(2)}
                        </td>
                        <td className="p-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            payment.payment_status === 'completed' ? 'bg-green-100 text-green-700' :
                            payment.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            payment.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {payment.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No payment records found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
