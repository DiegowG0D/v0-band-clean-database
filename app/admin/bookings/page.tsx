"use client";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Filter, CalendarPlus } from 'lucide-react';
import Link from "next/link";
import { BookingActions } from "@/components/admin/booking-actions";
import { useState, useEffect } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as XLSX from 'xlsx';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [cleaners, setCleaners] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCleaner, setSelectedCleaner] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<string[]>(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2025; year <= currentYear; year++) {
      years.push(year.toString());
    }
    return years;
  });

  useEffect(() => {
    loadBookings();
    loadCleaners();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [selectedMonth, selectedYear, selectedStatus, selectedCleaner, bookings]);

  const loadCleaners = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('role', 'cleaner')
      .order('full_name');

    if (data) {
      setCleaners(data);
    }
  };

  const loadBookings = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('bookings')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        status,
        total_price,
        duration_hours,
        cleaner_earnings,
        company_earnings,
        cleaner_id,
        customers (name, phone),
        services (name),
        users:cleaner_id (full_name)
      `)
      .order('scheduled_date', { ascending: false });

    if (data) {
      setBookings(data);
      setFilteredBookings(data);
    }
    setIsLoading(false);
  };

  const filterBookings = () => {
    const filtered = bookings.filter(booking => {
      const bookingDate = new Date(booking.scheduled_date);
      const bookingYear = bookingDate.getFullYear().toString();
      const bookingMonth = (bookingDate.getMonth() + 1).toString();
      
      const yearMatches = selectedYear === 'all' || bookingYear === selectedYear;
      const monthMatches = selectedMonth === 'all' || bookingMonth === selectedMonth;
      const statusMatches = selectedStatus === 'all' || booking.status === selectedStatus;
      const cleanerMatches = selectedCleaner === 'all' || 
                            (selectedCleaner === 'unassigned' && !booking.cleaner_id) ||
                            booking.cleaner_id === selectedCleaner;
      
      return yearMatches && monthMatches && statusMatches && cleanerMatches;
    });
    setFilteredBookings(filtered);
  };

  const exportToExcel = () => {
    const exportData = filteredBookings.map(booking => ({
      'Customer': booking.customers?.name || 'N/A',
      'Phone': booking.customers?.phone || 'N/A',
      'Service': booking.services?.name || 'N/A',
      'Date': new Date(booking.scheduled_date).toLocaleDateString(),
      'Time': booking.scheduled_time,
      'Cleaner': booking.users?.full_name || 'Unassigned',
      'Duration (hours)': booking.duration_hours,
      'Total Price (€)': Number(booking.total_price).toFixed(2),
      'Cleaner Earnings (€)': booking.cleaner_earnings ? Number(booking.cleaner_earnings).toFixed(2) : '0.00',
      'Company Earnings (€)': booking.company_earnings ? Number(booking.company_earnings).toFixed(2) : '0.00',
      'Status': booking.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
    
    const fileName = selectedMonth === 'all' && selectedYear === 'all'
      ? 'bookings_all.xlsx' 
      : `bookings_${selectedYear}_${selectedMonth}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
  };

  const exportToCSV = () => {
    const exportData = filteredBookings.map(booking => ({
      'Customer': booking.customers?.name || 'N/A',
      'Phone': booking.customers?.phone || 'N/A',
      'Service': booking.services?.name || 'N/A',
      'Date': new Date(booking.scheduled_date).toLocaleDateString(),
      'Time': booking.scheduled_time,
      'Cleaner': booking.users?.full_name || 'Unassigned',
      'Duration (hours)': booking.duration_hours,
      'Total Price (€)': Number(booking.total_price).toFixed(2),
      'Cleaner Earnings (€)': booking.cleaner_earnings ? Number(booking.cleaner_earnings).toFixed(2) : '0.00',
      'Company Earnings (€)': booking.company_earnings ? Number(booking.company_earnings).toFixed(2) : '0.00',
      'Status': booking.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const fileName = selectedMonth === 'all' && selectedYear === 'all'
      ? 'bookings_all.csv' 
      : `bookings_${selectedYear}_${selectedMonth}.csv`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const addNextYear = () => {
    const currentMaxYear = Math.max(...availableYears.map(y => parseInt(y)));
    const nextYear = (currentMaxYear + 1).toString();
    
    if (!availableYears.includes(nextYear)) {
      setAvailableYears(prev => [...prev, nextYear]);
      setSelectedYear(nextYear);
    }
  };

  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Manage all cleaning bookings
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/bookings/new">
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <CardTitle className="text-lg md:text-xl">All Bookings</CardTitle>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {monthOptions.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCleaner} onValueChange={setSelectedCleaner}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Cleaner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cleaners</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {cleaners.map(cleaner => (
                      <SelectItem key={cleaner.id} value={cleaner.id}>
                        {cleaner.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addNextYear}
                  className="w-full sm:w-auto"
                  title="Add next year to filter"
                >
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add Year
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportToExcel} className="flex-1 sm:flex-none">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export</span> XLSX
                </Button>
                <Button variant="outline" size="sm" onClick={exportToCSV} className="flex-1 sm:flex-none">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export</span> CSV
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBookings && filteredBookings.length > 0 ? (
              <>
                {/* Mobile view */}
                <div className="block md:hidden space-y-3">
                  {filteredBookings.map((booking) => (
                    <Card key={booking.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold">{booking.customers?.name}</p>
                            <p className="text-sm text-muted-foreground">{booking.customers?.phone}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            booking.status === 'confirmed' ? 'bg-purple-100 text-purple-700' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Service:</span> {booking.services?.name}</p>
                          <p><span className="font-medium">Date:</span> {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}</p>
                          <p><span className="font-medium">Cleaner:</span> {booking.users?.full_name || 'Unassigned'}</p>
                          <div className="pt-2 border-t space-y-1">
                            <p className="text-lg font-semibold text-primary">Total: €{Number(booking.total_price).toFixed(2)}</p>
                            {booking.cleaner_earnings && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 bg-green-50 rounded">
                                  <p className="text-muted-foreground">Cleaner Gets</p>
                                  <p className="font-semibold text-green-700">€{Number(booking.cleaner_earnings).toFixed(2)}</p>
                                </div>
                                <div className="p-2 bg-blue-50 rounded">
                                  <p className="text-muted-foreground">Company Gets</p>
                                  <p className="font-semibold text-blue-700">€{Number(booking.company_earnings).toFixed(2)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <BookingActions bookingId={booking.id} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Customer</th>
                        <th className="text-left p-2 font-medium">Service</th>
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">Time</th>
                        <th className="text-left p-2 font-medium">Cleaner</th>
                        <th className="text-left p-2 font-medium">Total Price</th>
                        <th className="text-left p-2 font-medium">Cleaner Gets</th>
                        <th className="text-left p-2 font-medium">Company Gets</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-left p-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{booking.customers?.name}</p>
                              <p className="text-xs text-muted-foreground">{booking.customers?.phone}</p>
                            </div>
                          </td>
                          <td className="p-2 text-sm">{booking.services?.name}</td>
                          <td className="p-2 text-sm">
                            {new Date(booking.scheduled_date).toLocaleDateString()}
                          </td>
                          <td className="p-2 text-sm">{booking.scheduled_time}</td>
                          <td className="p-2 text-sm">{booking.users?.full_name || 'Unassigned'}</td>
                          <td className="p-2 font-medium">€{Number(booking.total_price).toFixed(2)}</td>
                          <td className="p-2">
                            <span className="text-sm font-medium text-green-600">
                              {booking.cleaner_earnings ? `€${Number(booking.cleaner_earnings).toFixed(2)}` : '-'}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className="text-sm font-medium text-blue-600">
                              {booking.company_earnings ? `€${Number(booking.company_earnings).toFixed(2)}` : '-'}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              booking.status === 'confirmed' ? 'bg-purple-100 text-purple-700' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="p-2">
                            <BookingActions bookingId={booking.id} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12 space-y-3">
                <Filter className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                <p className="text-muted-foreground">
                  {selectedMonth === 'all' && selectedYear === 'all' && selectedStatus === 'all' && selectedCleaner === 'all'
                    ? 'No bookings found. Create your first booking to get started.'
                    : 'No bookings found for the selected filters.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
