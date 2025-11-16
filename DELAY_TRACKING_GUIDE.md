# Delay Tracking System - Band Clean

## Overview

The Band Clean system automatically tracks when cleaners clock in late for scheduled appointments. This helps managers identify patterns and address punctuality issues.

## How It Works

### Automatic Delay Detection

1. **Threshold**: A cleaner is marked as delayed if they clock in more than 15 minutes after the scheduled start time
2. **Calculation**: The system compares the actual clock-in time with the scheduled time from the booking
3. **Storage**: Delay information is stored in the `attendance_logs` table with two fields:
   - `delay_minutes`: Number of minutes late
   - `is_delayed`: Boolean flag indicating if delayed

### Visual Indicators

#### For Cleaners:
- **Before Clock In**: Yellow warning banner appears if running late
  - Shows how many minutes late they currently are
  - Warns that manager will be notified
- **After Clock In**: Yellow badge shows actual delay if they clocked in late

#### For Admins:
- **Timesheet Report**: 
  - Delayed clock-ins highlighted with yellow warning icon
  - Delay column shows exact minutes late
  - Statistics card shows total delayed clock-ins and average delay
- **Notifications**: Automatic notification sent to all admins when cleaner clocks in late

## Database Schema

### attendance_logs Table

\`\`\`sql
delay_minutes INTEGER DEFAULT 0
is_delayed BOOLEAN DEFAULT false
\`\`\`

### Triggers

- **calculate_clock_in_delay**: Automatically calculates delay when cleaner clocks in
- **notify_clock_events**: Sends notification to admins for delayed clock-ins

## Reports

### Timesheet Export

Both XLSX and CSV exports include:
- Cleaner name
- Date and time
- Total hours worked
- **Delay (min)**: Minutes late (0 if on time)
- Notes and justifications

### Analytics

- Total number of delayed clock-ins
- Average delay time
- Delay patterns by cleaner (viewable through filtering)

## Best Practices

### For Managers:
1. Review timesheet reports weekly to identify patterns
2. Filter by specific cleaners to track individual performance
3. Use delay data in performance reviews
4. Address consistent lateness with training or scheduling adjustments

### For Cleaners:
1. Always clock in on time to avoid delay tracking
2. The 15-minute grace period allows for minor delays
3. Delays are automatically recorded - no way to hide them
4. Justification notes can be added via re-clock in feature if needed

## Notification Types

When a cleaner clocks in late:
- **Type**: `clock_in_delay`
- **Recipients**: All admin users
- **Message**: "{Cleaner Name} clocked in {X} minutes late for {Customer Name}"
- **Real-time**: Delivered instantly via Supabase Realtime

## Audit Trail

All delay information is:
- Permanently stored in the database
- Included in all timesheet exports
- Cannot be modified by cleaners
- Visible to all administrators

## Configuration

To modify the delay threshold (currently 15 minutes):
Edit the trigger in `scripts/023_add_delay_tracking.sql`:

\`\`\`sql
IF v_delay_minutes > 15 THEN  -- Change this value
\`\`\`

Then re-run the script to update the trigger.
