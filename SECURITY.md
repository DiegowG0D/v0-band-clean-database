# Security Documentation - Band Clean Management System

## Overview

This document outlines the security measures implemented in the Band Clean Management System to protect user data, prevent unauthorized access, and ensure system integrity.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection](#data-protection)
3. [Input Validation](#input-validation)
4. [Rate Limiting](#rate-limiting)
5. [Security Headers](#security-headers)
6. [Audit Logging](#audit-logging)
7. [Best Practices](#best-practices)
8. [Incident Response](#incident-response)

---

## Authentication & Authorization

### Supabase Authentication
- All authentication is handled through Supabase Auth
- Email and password authentication with secure password hashing
- JWT tokens for session management
- Automatic token refresh through middleware

### Role-Based Access Control (RBAC)
Two user roles are implemented:
- **Admin**: Full system access
- **Cleaner**: Limited access to own data only

### Route Protection
- Middleware validates authentication on all protected routes
- Role verification prevents cross-role access
- Automatic redirection based on user role

\`\`\`typescript
// Example: Admin-only route protection
await requireRole('admin');
\`\`\`

---

## Data Protection

### Row Level Security (RLS)
All database tables have RLS policies enabled:

**Users Table:**
- Users can view their own profile
- Admins can view and manage all users

**Bookings Table:**
- Cleaners can only view their assigned bookings
- Admins have full access

**Attendance Logs:**
- Cleaners can only view/modify their own records
- Admins have full access

**Payments & Customers:**
- Admin-only access

### Data Encryption
- All data in transit is encrypted via HTTPS
- Database credentials stored as environment variables
- Supabase handles data-at-rest encryption

---

## Input Validation

### Zod Schema Validation
All user inputs are validated using Zod schemas:

\`\`\`typescript
// Example: Booking validation
export const bookingSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  service_id: z.string().uuid('Invalid service ID'),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  notes: z.string().max(500).nullable(),
});
\`\`\`

### SQL Injection Prevention
- All database queries use Supabase client with parameterized queries
- No raw SQL from user input
- Email format validation at database level

### XSS Prevention
- HTML sanitization utility for user-generated content
- React automatically escapes JSX content
- Content Security Policy headers

---

## Rate Limiting

Rate limiting is implemented to prevent abuse:

\`\`\`typescript
// Default: 10 requests per minute per IP
const { allowed, remaining } = rateLimit(request, {
  windowMs: 60000,
  max: 10,
});
\`\`\`

Apply to sensitive endpoints:
- Login attempts
- Form submissions
- Clock in/out operations

---

## Security Headers

The following security headers are automatically applied:

\`\`\`typescript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
\`\`\`

These headers protect against:
- MIME type sniffing attacks
- Clickjacking
- XSS attacks
- Information leakage

---

## Audit Logging

All critical operations are logged in the `audit_logs` table:

**Logged Events:**
- Booking creation, updates, deletion
- Payment transactions
- User account changes

**Audit Log Structure:**
\`\`\`sql
- user_id: Who performed the action
- action: INSERT, UPDATE, DELETE
- table_name: Which table was affected
- record_id: Specific record ID
- old_data: Previous state (JSON)
- new_data: New state (JSON)
- timestamp: When it occurred
\`\`\`

**Retention:** Audit logs are retained indefinitely for compliance.

---

## Best Practices

### For Developers

1. **Never expose sensitive data in client components**
   - Keep API keys server-side only
   - Use environment variables properly

2. **Always validate user input**
   - Client-side AND server-side validation
   - Use Zod schemas consistently

3. **Use the permission utilities**
   \`\`\`typescript
   await requireRole('admin');
   await canAccessResource(resourceUserId);
   \`\`\`

4. **Handle errors securely**
   - Never expose internal errors to clients
   - Use sanitizeError() utility
   - Log security events appropriately

5. **Database constraints**
   - Negative price checks
   - Clock-out after clock-in validation
   - Single active clock-in per cleaner

### For Administrators

1. **Regular security audits**
   - Review audit logs weekly
   - Monitor for suspicious activity
   - Check failed login attempts

2. **User management**
   - Remove inactive accounts
   - Review cleaner permissions
   - Enforce strong passwords

3. **Data backups**
   - Supabase handles automatic backups
   - Test restore procedures quarterly

4. **Update dependencies**
   - Keep packages up to date
   - Monitor security advisories

---

## Incident Response

### If a Security Breach is Suspected

1. **Immediate Actions**
   - Document the incident with timestamps
   - Identify affected systems and data
   - Contain the breach (disable accounts if needed)

2. **Investigation**
   - Review audit logs for unauthorized access
   - Check rate limit violations
   - Examine database for unexpected changes

3. **Recovery**
   - Reset compromised passwords
   - Revoke affected sessions
   - Restore from backup if necessary

4. **Prevention**
   - Identify root cause
   - Implement additional controls
   - Update security documentation

### Contact
For security concerns, contact the system administrator immediately.

---

## Security Checklist

### Pre-Production
- [ ] All RLS policies enabled
- [ ] Environment variables secured
- [ ] Rate limiting active on sensitive endpoints
- [ ] Security headers configured
- [ ] Input validation on all forms
- [ ] Audit logging functional
- [ ] Error handling sanitized

### Ongoing
- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Security training for new developers
- [ ] Incident response plan tested quarterly
- [ ] Backup restoration tested quarterly

---

## Compliance

### Data Privacy
- User data access follows GDPR principles
- Data minimization practiced
- Right to erasure can be implemented via admin

### Data Retention
- Audit logs: Indefinite
- User data: Until account deletion
- Booking history: Until admin deletion

---

**Last Updated:** 2025-01-15
**Version:** 1.0
**Maintained By:** Development Team
