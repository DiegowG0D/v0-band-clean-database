"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { Search, User } from 'lucide-react';

interface BookingFormProps {
  customers: { id: string; name: string; email: string; phone: string; address: string }[];
  services: { 
    id: string; 
    name: string; 
    base_price: string; 
    duration_hours: string;
    description?: string;
  }[];
  cleaners: { id: string; full_name: string }[];
  booking?: {
    id: string;
    customer_id: string;
    service_id: string;
    cleaner_id?: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    total_price: string;
    notes?: string;
    customer?: {
      id: string;
      name: string;
      email: string;
      phone: string;
      address: string;
    };
  };
}

export function BookingForm({ customers, services, cleaners, booking }: BookingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: booking?.customer_id || '',
    customer_name: booking?.customer?.name || '',
    customer_email: booking?.customer?.email || '',
    customer_phone: booking?.customer?.phone || '',
    customer_address: booking?.customer?.address || '',
    service_id: booking?.service_id || '',
    cleaner_id: booking?.cleaner_id || '',
    scheduled_date: booking?.scheduled_date || '',
    scheduled_time: booking?.scheduled_time || '',
    status: booking?.status || 'pending',
    total_price: booking?.total_price || '',
    notes: booking?.notes || '',
  });

  const handleSelectCustomer = (customer: typeof customers[0]) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_address: customer.address,
    }));
    setDialogOpen(false);
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    const basePrice = parseFloat(service.base_price);
    setFormData(prev => ({
      ...prev,
      service_id: serviceId,
      // Only auto-fill price if it's not custom pricing (base_price > 0)
      total_price: basePrice > 0 ? basePrice.toString() : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('[v0] Starting booking creation/update');
      console.log('[v0] Form data:', formData);

      if (!formData.service_id || !formData.scheduled_date || !formData.scheduled_time) {
        throw new Error('Please fill in service, date, and time');
      }

      if (!formData.customer_name?.trim() || !formData.customer_email?.trim() || !formData.customer_phone?.trim()) {
        throw new Error('Please fill in customer name, email, and phone');
      }

      const priceValue = parseFloat(formData.total_price);
      if (!formData.total_price || isNaN(priceValue) || priceValue <= 0) {
        throw new Error('Please enter a valid price greater than 0');
      }

      const supabase = createClient();
      let customerId = formData.customer_id;

      // Create or update customer
      if (!customerId) {
        console.log('[v0] Creating new customer');
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: formData.customer_name.trim(),
            email: formData.customer_email.trim(),
            phone: formData.customer_phone.trim(),
            address: formData.customer_address?.trim() || 'Not provided',
            city: 'Not provided',
            postal_code: 'Not provided',
            country: 'Malta',
          })
          .select()
          .single();

        if (customerError) {
          console.error('[v0] Customer creation error:', customerError);
          throw new Error(`Failed to create customer: ${customerError.message}`);
        }
        customerId = newCustomer.id;
        console.log('[v0] Customer created with ID:', customerId);
      } else {
        console.log('[v0] Updating existing customer:', customerId);
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            name: formData.customer_name.trim(),
            email: formData.customer_email.trim(),
            phone: formData.customer_phone.trim(),
            address: formData.customer_address?.trim() || 'Not provided',
          })
          .eq('id', customerId);

        if (updateError) {
          console.error('[v0] Customer update error:', updateError);
          throw new Error(`Failed to update customer: ${updateError.message}`);
        }
        console.log('[v0] Customer updated successfully');
      }

      // Get service duration
      const service = services.find(s => s.id === formData.service_id);
      const durationHours = service ? parseFloat(service.duration_hours) : 1.0;

      const bookingData = {
        customer_id: customerId,
        service_id: formData.service_id,
        cleaner_id: formData.cleaner_id || null,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        duration_hours: durationHours,
        status: formData.status,
        total_price: priceValue,
        notes: formData.notes?.trim() || null,
      };

      console.log('[v0] Booking data to save:', bookingData);

      if (booking) {
        console.log('[v0] Updating booking:', booking.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update(bookingData)
          .eq('id', booking.id);
        
        if (updateError) {
          console.error('[v0] Booking update error:', updateError);
          throw new Error(`Failed to update booking: ${updateError.message}`);
        }
        console.log('[v0] Booking updated successfully');
      } else {
        console.log('[v0] Creating new booking');
        const { error: insertError } = await supabase
          .from('bookings')
          .insert(bookingData);
        
        if (insertError) {
          console.error('[v0] Booking insert error:', insertError);
          throw new Error(`Failed to create booking: ${insertError.message}`);
        }
        console.log('[v0] Booking created successfully');
      }
      
      router.push('/admin/bookings');
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('[v0] Booking form error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedService = services.find(s => s.id === formData.service_id);
  const isCustomPricing = selectedService && parseFloat(selectedService.base_price) === 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Customer Information</h3>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-2">
                    <Search className="h-4 w-4" />
                    Search Existing Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Select Existing Customer</DialogTitle>
                    <DialogDescription>
                      Search and select a customer to auto-fill their information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                    <div className="space-y-2">
                      {filteredCustomers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No customers found
                        </p>
                      ) : (
                        filteredCustomers.map(customer => (
                          <div
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          >
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  placeholder="Enter customer name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_email">Customer Email *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.customer_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_phone">Customer Phone *</Label>
                <Input
                  id="customer_phone"
                  placeholder="+356 1234 5678"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_address">Customer Address</Label>
                <Input
                  id="customer_address"
                  placeholder="Customer address (optional)"
                  value={formData.customer_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Booking Details Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service">Service *</Label>
              <Select
                value={formData.service_id}
                onValueChange={handleServiceChange}
                required
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedService?.description && (
                <p className="text-xs text-muted-foreground mt-1">{selectedService.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaner">Assign Cleaner</Label>
              <Select
                value={formData.cleaner_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cleaner_id: value }))}
              >
                <SelectTrigger id="cleaner">
                  <SelectValue placeholder="Select cleaner (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {cleaners.map(cleaner => (
                    <SelectItem key={cleaner.id} value={cleaner.id}>
                      {cleaner.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                required
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Scheduled Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">Service start time</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                Total Price (€) * 
                {isCustomPricing && <span className="text-xs text-amber-600 ml-2">(Enter custom price)</span>}
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.total_price}
                onChange={(e) => setFormData(prev => ({ ...prev, total_price: e.target.value }))}
                required
                placeholder={isCustomPricing ? "Enter custom price" : "Price"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any special instructions or notes..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading ? 'Saving...' : booking ? 'Update Booking' : 'Create Booking'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/bookings')}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
