"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { Clock } from 'lucide-react';
import { getMaltaDateTime } from "@/lib/utils/date-utils";

interface ClockInOutButtonProps {
  isClockedIn: boolean;
  attendanceId?: string;
}

export function ClockInOutButton({ isClockedIn, attendanceId }: ClockInOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClockIn = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    const { data: existingLog } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('cleaner_id', user.id)
      .eq('status', 'clocked_in')
      .single();

    if (existingLog) {
      setError('You are already clocked in');
      setIsLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('attendance_logs')
      .insert({
        cleaner_id: user.id,
        clock_in: getMaltaDateTime(),
        status: 'clocked_in'
      });

    if (insertError) {
      setError('Failed to clock in');
    } else {
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleClockOut = async () => {
    if (!attendanceId) return;
    
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('attendance_logs')
      .update({
        clock_out: getMaltaDateTime(),
        status: 'clocked_out'
      })
      .eq('id', attendanceId);

    if (updateError) {
      setError('Failed to clock out');
    } else {
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        {isClockedIn ? (
          <Button
            onClick={handleClockOut}
            disabled={isLoading}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Clock className="h-5 w-5" />
            {isLoading ? 'Clocking Out...' : 'Clock Out'}
          </Button>
        ) : (
          <Button
            onClick={handleClockIn}
            disabled={isLoading}
            size="lg"
            className="gap-2"
          >
            <Clock className="h-5 w-5" />
            {isLoading ? 'Clocking In...' : 'Clock In'}
          </Button>
        )}
        {isClockedIn && (
          <p className="text-sm text-muted-foreground">
            {'You are currently clocked in'}
          </p>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
