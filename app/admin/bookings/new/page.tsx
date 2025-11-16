import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/admin/booking-form";

export default async function NewBookingPage() {
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, email, phone, address')
    .order('name', { ascending: true });

  const { data: services } = await supabase
    .from('services')
    .select('id, name, base_price, duration_hours, description')
    .eq('is_active', true)
    .order('name', { ascending: true });

  const { data: cleaners } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'cleaner')
    .order('full_name', { ascending: true });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">New Booking</h1>
        <p className="text-muted-foreground">
          Create a new cleaning booking
        </p>
      </div>

      <BookingForm 
        customers={customers || []}
        services={services || []}
        cleaners={cleaners || []}
      />
    </div>
  );
}
