# Secure Authentication Setup - Band Clean

## Critical Security Fixes Applied

### 1. Removed Public Admin Registration
**SECURITY ISSUE FIXED**: Previously, anyone could create an admin account through the signup page.

**Solution**:
- Removed role selector from public signup page
- All public signups now create **cleaner accounts only**
- Admin accounts can **only** be created by existing administrators through the admin panel

### 2. Database Trigger Security
The `handle_new_user()` trigger now **forces** all public signups to be cleaners:
\`\`\`sql
user_role := 'cleaner';  -- Hardcoded, ignores any role parameter
\`\`\`

### 3. Initial Admin Account Setup

**IMPORTANT**: You need to create the first admin account manually:

#### Option A: Via Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard > Authentication > Users
2. Create a new user with email: `admin@bandclean.com`
3. Set a strong password (e.g., `Admin123!ChangeMe`)
4. After creation, go to SQL Editor and run:
\`\`\`sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@bandclean.com';

DELETE FROM public.cleaner_details 
WHERE user_id = (SELECT id FROM public.users WHERE email = 'admin@bandclean.com');
\`\`\`

#### Option B: Create Via Sign-up then Upgrade
1. Sign up normally at `/auth/sign-up` with your admin email
2. Go to Supabase SQL Editor and run:
\`\`\`sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-admin-email@bandclean.com';

DELETE FROM public.cleaner_details 
WHERE user_id = (SELECT id FROM public.users WHERE email = 'your-admin-email@bandclean.com');
\`\`\`

### 4. Email Verification Disabled
To simplify the login process during development:
- Email verification is **disabled** by default
- Users can login immediately after signup
- To enable email verification: Go to Supabase Dashboard > Authentication > Settings > Enable "Confirm email"

**Production Recommendation**: Enable email verification for production deployments.

### 5. Admin User Management Panel

Administrators can now create new users (both admin and cleaner) through:
- **URL**: `/admin/users`
- **Features**:
  - View all users in the system
  - Create new admin or cleaner accounts
  - Generate secure temporary passwords
  - See user roles and status

#### Creating New Users as Admin:
1. Login as admin
2. Navigate to "Users" in the sidebar
3. Click "Create User"
4. Fill in user details
5. Select role (Admin or Cleaner)
6. Click "Generate" to create a temporary password
7. Submit and share the credentials securely with the new user

### 6. Security Best Practices Implemented

✅ **Role-Based Access Control (RBAC)**
- All routes protected with middleware
- RLS policies prevent unauthorized data access
- Functions use `SECURITY DEFINER` to avoid recursion

✅ **Input Validation**
- Email format validation
- Password minimum length (6 characters)
- Required fields enforced

✅ **Audit Logging**
- All admin actions logged in `audit_logs` table
- User creation tracked with admin attribution

✅ **Secure Password Handling**
- Passwords never stored in plain text
- Handled by Supabase Auth
- Temporary passwords for admin-created accounts

✅ **Principle of Least Privilege**
- Cleaners only see their own data
- Admins have full system access
- No privilege escalation possible from frontend

## Scripts Execution Order

Execute these scripts in order in your Supabase SQL Editor:

1. `001_create_tables.sql` - Create all database tables
2. `002_enable_rls.sql` - Enable Row Level Security
3. `003_create_rls_policies.sql` - Create RLS policies
4. `004_create_functions.sql` - Create helper functions
5. `005_seed_data.sql` - Seed initial data (services, customers)
6. `007_fix_auth_trigger.sql` - Auth trigger for user creation
7. `008_fix_rls_recursion.sql` - Fix RLS recursion issues
8. `009_ensure_user_exists.sql` - User sync function
9. `010_secure_auth_system.sql` - **CRITICAL**: Secure auth system

## Testing the Setup

### Test Cleaner Signup:
1. Navigate to `/auth/sign-up`
2. Fill in details (email, name, phone, password)
3. Submit
4. Should redirect to `/cleaner` dashboard
5. Verify role is "cleaner" in database

### Test Admin Login:
1. Create admin account using Option A or B above
2. Navigate to `/auth/login`
3. Login with admin credentials
4. Should redirect to `/admin` dashboard
5. Verify "Users" menu item appears

### Test Admin User Creation:
1. Login as admin
2. Navigate to `/admin/users`
3. Click "Create User"
4. Create a new cleaner or admin
5. Verify user appears in users list
6. Test login with new credentials

## Security Checklist

Before going to production:

- [ ] Change default admin password
- [ ] Enable email verification in Supabase
- [ ] Review all RLS policies
- [ ] Enable rate limiting on API routes
- [ ] Configure CORS properly
- [ ] Enable 2FA for admin accounts (Supabase feature)
- [ ] Backup database regularly
- [ ] Monitor audit logs for suspicious activity
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS only (handled by Vercel)

## Common Issues

### "Cannot coerce the result to a single JSON object"
- This was caused by RLS policies
- Fixed with `SECURITY DEFINER` functions
- Make sure scripts 8 and 9 are executed

### "No user found in public.users table"
- User exists in auth.users but not public.users
- Run script 9 (`ensure_user_exists.sql`)
- The login page now auto-creates missing users

### Cannot create admin account
- By design! This is a security feature
- Create via admin panel or SQL only

## Support

For issues or questions:
1. Check the scripts are executed in order
2. Verify RLS policies are active
3. Check Supabase logs for errors
4. Review this documentation

**Remember**: Security is not a feature, it's a requirement. These measures protect your business and your users' data.
