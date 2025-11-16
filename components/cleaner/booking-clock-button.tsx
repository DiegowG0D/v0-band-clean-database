"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { Clock, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { getMaltaDateTime } from "@/lib/utils/date-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BookingClockButtonProps {
  bookingId: string;
  attendance?: {
    id: string;
    clock_in: string;
    clock_out: string | null;
    status: string;
    total_hours?: number;
    delay_minutes?: number;
    is_delayed?: boolean;
  } | null;
  cleanerId: string;
  estimatedHours?: number;
  scheduledDateTime?: string;
}

export function BookingClockButton({ 
  bookingId, 
  attendance, 
  cleanerId, 
  estimatedHours,
  scheduledDateTime 
}: BookingClockButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEarlyClockOutDialog, setShowEarlyClockOutDialog] = useState(false);
  const [showReClockInDialog, setShowReClockInDialog] = useState(false);
  const [justification, setJustification] = useState("");
  const router = useRouter();

  const isClockedIn = attendance && !attendance.clock_out && attendance.status === 'clocked_in';
  const isCompleted = attendance?.clock_out;

  const calculateDelay = () => {
    if (!scheduledDateTime) return 0;
    const scheduled = new Date(scheduledDateTime);
    const now = new Date();
    return Math.floor((now.getTime() - scheduled.getTime()) / (1000 * 60));
  };

  const handleClockIn = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: insertError } = await supabase
      .from('attendance_logs')
      .insert({
        cleaner_id: cleanerId,
        booking_id: bookingId,
        clock_in: getMaltaDateTime(),
        status: 'clocked_in'
      });

    if (insertError) {
      setError('Failed to clock in');
      console.error('Clock in error:', insertError);
    } else {
      await supabase
        .from('bookings')
        .update({ status: 'in_progress' })
        .eq('id', bookingId);
      
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleReClockIn = async () => {
    if (!justification.trim()) {
      setError('Please provide a justification');
      return;
    }

    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: insertError } = await supabase
      .from('attendance_logs')
      .insert({
        cleaner_id: cleanerId,
        booking_id: bookingId,
        clock_in: getMaltaDateTime(),
        status: 'clocked_in',
        notes: `RE-CLOCK IN: ${justification}`
      });

    if (insertError) {
      setError('Failed to clock in');
      console.error('Re-clock in error:', insertError);
    } else {
      await supabase
        .from('bookings')
        .update({ status: 'in_progress' })
        .eq('id', bookingId);
      
      setShowReClockInDialog(false);
      setJustification("");
      router.refresh();
    }
    setIsLoading(false);
  };

  const initiateClockOut = () => {
    if (!attendance?.clock_in || !estimatedHours) {
      performClockOut();
      return;
    }

    const clockInTime = new Date(attendance.clock_in);
    const currentTime = new Date();
    const hoursWorked = (currentTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

    // If worked less than 90% of estimated time, show confirmation
    if (hoursWorked < estimatedHours * 0.9) {
      setShowEarlyClockOutDialog(true);
    } else {
      performClockOut();
    }
  };

  const performClockOut = async () => {
    if (!attendance?.id) return;
    
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    const clockOutTime = getMaltaDateTime();

    const clockInTime = new Date(attendance.clock_in);
    const clockOutDate = new Date(clockOutTime);
    const hoursWorked = (clockOutDate.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

    const { error: updateError } = await supabase
      .from('attendance_logs')
      .update({
        clock_out: clockOutTime,
        total_hours: hoursWorked,
        status: 'clocked_out'
      })
      .eq('id', attendance.id);

    if (updateError) {
      setError('Failed to clock out');
      console.error('Clock out error:', updateError);
    } else {
      await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);
      
      setShowEarlyClockOutDialog(false);
      router.refresh();
    }
    setIsLoading(false);
  };

  const currentDelay = calculateDelay();
  const isCurrentlyDelayed = currentDelay > 15;

  return (
    <>
      <div className="space-y-2">
        {!isClockedIn && !isCompleted && isCurrentlyDelayed && (
          <div className="flex items-center gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Running {currentDelay} minutes late
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Your manager will be notified of the delay
              </p>
            </div>
          </div>
        )}

        {attendance?.is_delayed && (
          <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span>Clocked in {attendance.delay_minutes} min late</span>
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          {isClockedIn ? (
            <>
              <Button
                onClick={initiateClockOut}
                disabled={isLoading}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                {isLoading ? 'Clocking Out...' : 'Clock Out'}
              </Button>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Clocked in
                </p>
                <p className="text-xs text-muted-foreground">
                  Since {new Date(attendance.clock_in).toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'Europe/Malta'
                  })}
                </p>
              </div>
            </>
          ) : isCompleted ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-600 dark:text-green-400">Completed</p>
                  <p className="text-xs text-muted-foreground">
                    {attendance.total_hours?.toFixed(2) || 0}h worked
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowReClockInDialog(true)}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Re-Clock In
              </Button>
            </>
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
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      <Dialog open={showEarlyClockOutDialog} onOpenChange={setShowEarlyClockOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Early Clock Out
            </DialogTitle>
            <DialogDescription>
              You are clocking out earlier than the estimated time for this job. 
              {estimatedHours && attendance?.clock_in && (
                <>
                  <br />
                  <span className="font-medium">
                    Estimated: {estimatedHours}h | 
                    Current: {((new Date().getTime() - new Date(attendance.clock_in).getTime()) / (1000 * 60 * 60)).toFixed(2)}h
                  </span>
                </>
              )}
              <br /><br />
              Are you sure you want to clock out now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEarlyClockOutDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={performClockOut}
              disabled={isLoading}
            >
              {isLoading ? 'Clocking Out...' : 'Confirm Clock Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReClockInDialog} onOpenChange={setShowReClockInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-Clock In</DialogTitle>
            <DialogDescription>
              Please provide a reason for clocking in again for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="justification">Justification *</Label>
              <Textarea
                id="justification"
                placeholder="Example: Returned to complete additional cleaning tasks requested by client"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowReClockInDialog(false);
                setJustification("");
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReClockIn}
              disabled={isLoading || !justification.trim()}
            >
              {isLoading ? 'Clocking In...' : 'Clock In'}
            </Button>
          </DialogFooter>
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
