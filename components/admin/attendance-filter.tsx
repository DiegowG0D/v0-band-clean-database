"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from "react";

interface AttendanceFilterProps {
  cleaners: { id: string; full_name: string }[];
}

export function AttendanceFilter({ cleaners }: AttendanceFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedCleaner, setSelectedCleaner] = useState(searchParams.get('cleaner') || 'all');
  const [selectedPeriod, setSelectedPeriod] = useState(searchParams.get('period') || 'all');

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedCleaner !== 'all') {
      params.set('cleaner', selectedCleaner);
    }
    if (selectedPeriod !== 'all') {
      params.set('period', selectedPeriod);
    }
    router.push(`/admin/attendance?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedCleaner('all');
    setSelectedPeriod('all');
    router.push('/admin/attendance');
  };

  return (
    <div className="flex gap-4 items-end flex-wrap">
      <div className="space-y-2 flex-1 min-w-[200px]">
        <label className="text-sm font-medium">Cleaner</label>
        <Select value={selectedCleaner} onValueChange={setSelectedCleaner}>
          <SelectTrigger>
            <SelectValue placeholder="All cleaners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cleaners</SelectItem>
            {cleaners.map(cleaner => (
              <SelectItem key={cleaner.id} value={cleaner.id}>
                {cleaner.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 flex-1 min-w-[200px]">
        <label className="text-sm font-medium">Period</label>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger>
            <SelectValue placeholder="All time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={applyFilters}>Apply Filters</Button>
        <Button variant="outline" onClick={clearFilters}>Clear</Button>
      </div>
    </div>
  );
}
