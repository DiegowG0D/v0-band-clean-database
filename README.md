# Band Clean Management System

A comprehensive management system for international cleaning companies with role-based access control for Admins and Cleaners.

## Features

### Admin Dashboard
- Real-time KPI monitoring
- Cleaner management
- Booking management (CRUD operations)
- Attendance tracking
- Financial reports
- Customer management

### Cleaner Dashboard
- View assigned tasks
- Clock in/out functionality
- Personal attendance history
- Upcoming bookings

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **UI Components:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS v4
- **Validation:** Zod
- **Language:** TypeScript

## Security Features

- Row Level Security (RLS) on all tables
- Role-based access control (RBAC)
- Input validation with Zod schemas
- Rate limiting on sensitive endpoints
- Security headers (XSS, CSRF, Clickjacking protection)
- Audit logging for compliance
- Encrypted data in transit and at rest

See [SECURITY.md](./SECURITY.md) for detailed security documentation.

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- Git

### Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd band-clean
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables

Create a `.env.local` file with your Supabase credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

4. Run database migrations

Execute the SQL scripts in order from the `scripts` folder in your Supabase SQL editor:
- `001_create_tables.sql`
- `002_enable_rls.sql`
- `003_create_rls_policies.sql`
- `004_create_functions.sql`
- `005_seed_data.sql`
- `006_security_enhancements.sql`

5. Start the development server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Default Credentials (after seeding)

**Admin:**
- Email: admin@bandclean.com
- Password: admin123

**Cleaner:**
- Email: cleaner@bandclean.com
- Password: cleaner123

**⚠️ Change these passwords immediately in production!**

## Project Structure

\`\`\`
├── app/
│   ├── admin/              # Admin dashboard pages
│   ├── cleaner/            # Cleaner dashboard pages
│   ├── auth/               # Authentication pages
│   └── api/                # API routes
├── components/
│   ├── admin/              # Admin-specific components
│   ├── cleaner/            # Cleaner-specific components
│   └── ui/                 # Shared UI components
├── lib/
│   ├── supabase/           # Supabase client configuration
│   └── security/           # Security utilities
└── scripts/                # Database migration scripts
\`\`\`

## Database Schema

### Main Tables
- `users` - User accounts with roles
- `cleaner_details` - Extended cleaner information
- `customers` - Customer information
- `services` - Service catalog
- `bookings` - Booking records
- `attendance_logs` - Clock in/out records
- `payments` - Payment transactions
- `audit_logs` - System audit trail

See `scripts/001_create_tables.sql` for full schema details.

## Development

### Code Style
- Follow TypeScript best practices
- Use ESLint for code quality
- Follow the component structure in `components/`

### Adding New Features

1. Update database schema if needed
2. Add RLS policies for new tables
3. Create Zod validation schemas
4. Implement UI components
5. Add proper error handling
6. Update documentation

### Testing

Before deploying:
- Test all user roles
- Verify RLS policies
- Check input validation
- Review audit logs
- Test error scenarios

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Ensure your platform supports:
- Node.js 18+
- Environment variables
- Supabase connection

## Maintenance

### Regular Tasks
- Review audit logs weekly
- Update dependencies monthly
- Backup database regularly
- Monitor security advisories
- Review and rotate API keys

### Database Maintenance
- Run `cleanup_old_rate_limits()` daily
- Archive old audit logs as needed
- Optimize database indexes

## Troubleshooting

### Common Issues

**Authentication errors:**
- Verify Supabase credentials
- Check RLS policies
- Ensure middleware is running

**Permission denied:**
- Verify user role in database
- Check RLS policies for table
- Review middleware logs

**Database connection:**
- Verify environment variables
- Check Supabase project status
- Review connection pooling settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software for Band Clean.

## Support

For technical support or security concerns, contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-15
