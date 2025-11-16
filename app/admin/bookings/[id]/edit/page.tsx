import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/admin/booking-form";
import { notFound } from 'next/navigation';

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:customers(id, name, email, phone, address)
    `)
    .eq('id', id)
    .single();

  if (!booking) {
    notFound();
  }

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
        <h1 className="text-2xl md:text-3xl font-bold">Edit Booking</h1>
        <p className="text-muted-foreground">
          Update booking details
        </p>
      </div>

      <BookingForm 
        customers={customers || []}
        services={services || []}
        cleaners={cleaners || []}
        booking={booking}
      />
    </div>
  );
}
