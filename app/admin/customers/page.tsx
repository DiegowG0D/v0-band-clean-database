import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UsersIcon } from 'lucide-react';
import Link from "next/link";

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6 pt-20 lg:pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your customer database
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/customers/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {customers && customers.length > 0 ? (
            <>
              <div className="block md:hidden space-y-3">
                {customers.map((customer) => (
                  <Card key={customer.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        <p className="text-sm">{customer.address}</p>
                        <p className="text-sm text-muted-foreground">{customer.city}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link href={`/admin/customers/${customer.id}/edit`}>
                          Edit Customer
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">Email</th>
                      <th className="text-left p-2 font-medium">Phone</th>
                      <th className="text-left p-2 font-medium">Address</th>
                      <th className="text-left p-2 font-medium">City</th>
                      <th className="text-left p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-2 font-medium">{customer.name}</td>
                        <td className="p-2 text-sm">{customer.email}</td>
                        <td className="p-2 text-sm">{customer.phone}</td>
                        <td className="p-2 text-sm">{customer.address}</td>
                        <td className="p-2 text-sm">{customer.city}</td>
                        <td className="p-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/customers/${customer.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 space-y-3">
              <UsersIcon className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground">
                No customers found. Add your first customer to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
