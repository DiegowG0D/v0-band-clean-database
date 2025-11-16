// Input validation schemas and utilities
import { z } from 'zod';

// Booking validation schema
export const bookingSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  service_id: z.string().uuid('Invalid service ID'),
  cleaner_id: z.string().uuid('Invalid cleaner ID').nullable(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']),
  total_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  notes: z.string().max(500, 'Notes too long').nullable(),
});

// Attendance validation schema
export const attendanceSchema = z.object({
  cleaner_id: z.string().uuid('Invalid cleaner ID'),
  clock_in: z.string().datetime('Invalid datetime format'),
  clock_out: z.string().datetime('Invalid datetime format').nullable(),
});

// User profile validation schema
export const userProfileSchema = z.object({
  full_name: z.string().min(2, 'Name too short').max(100, 'Name too long'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').nullable(),
});

// Sanitize HTML to prevent XSS
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate and sanitize user input
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Validation failed' };
  }
}
