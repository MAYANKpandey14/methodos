# Security Policy

## Overview

This document outlines the security measures, best practices, and policies implemented in the MethodOS application to protect user data and ensure secure operation.

## Password Requirements

All user passwords must meet the following requirements:
- **Minimum length:** 8 characters
- **Uppercase letters:** At least one (A-Z)
- **Lowercase letters:** At least one (a-z)
- **Numbers:** At least one (0-9)
- **Special characters:** At least one (!@#$%^&*(),.?":{}|<>)

These requirements are enforced through centralized validation in `src/utils/security.ts` using the `validatePasswordStrength()` function.

## Data Storage Practices

### User Profiles
- User profile data is stored in the `profiles` table with Row Level Security (RLS) enabled
- Each user can only access and modify their own profile data
- Avatar URLs and display names are validated before storage

### Authentication Data
- User authentication is handled by Supabase Auth
- Passwords are hashed using bcrypt before storage
- Session tokens are stored in localStorage with automatic refresh
- **Security Note:** Email addresses are passed via URL parameters during verification, NOT stored in localStorage

### Task and Note Data
- All user-generated content (tasks, notes, bookmarks) is isolated by user ID
- RLS policies ensure users can only access their own data
- Input validation and sanitization is applied to all user inputs

## Row Level Security (RLS) Policies

All database tables have RLS enabled with the following access patterns:

### Profiles Table
- **SELECT:** Users can view their own profile only
- **UPDATE:** Users can update their own profile only
- **INSERT:** Automatically created on signup via database trigger

### Tasks, Notes, Bookmarks Tables
- **SELECT:** Users can only view their own records
- **INSERT:** Users can only create records for themselves
- **UPDATE:** Users can only update their own records
- **DELETE:** Users can only delete their own records

### Storage Buckets
- **Avatars Bucket:** Currently PUBLIC for user avatars to be displayable
  - Users can upload avatars to their own folder (`user_id/filename`)
  - Users can only update/delete their own avatar files
  - This is intentional to allow avatar display across the application
  
## Input Validation and Sanitization

### Client-Side Validation
All user inputs are validated using functions in `src/utils/security.ts`:
- `sanitizeInput()`: Removes potentially dangerous characters
- `validateEmail()`: Validates email format and length
- `validatePasswordStrength()`: Enforces password complexity
- `validateUrl()`: Prevents SSRF and validates URLs
- `validateTaskTitle()`: Enforces title length limits
- `validateTagName()`: Validates tag names and prevents special characters

### Server-Side Validation
- Database constraints enforce data integrity
- RLS policies provide an additional security layer
- Triggers validate data on insert/update

## Security Headers

The application includes security headers configured in `public/_headers`:

```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [see file for full policy]
```

**Development Note:** `X-Frame-Options: DENY` and `frame-ancestors 'none'` are commented out to allow the Lovable editor to function. For production deployment, consider enabling these headers if not using the Lovable editor.

## Supabase Security Configuration

### Recommended Settings in Supabase Dashboard

1. **Enable Leaked Password Protection**
   - Navigate to: Authentication > Settings
   - Enable "Leaked Password Protection" to prevent users from using compromised passwords
   - This checks passwords against the HaveIBeenPwned database

2. **Upgrade PostgreSQL Version**
   - Navigate to: Settings > Database
   - Ensure you're running the latest PostgreSQL version
   - Check for security updates regularly

3. **Email Confirmation**
   - Navigate to: Authentication > Settings
   - "Confirm email" is currently enabled for production security
   - For testing/development, you may disable this in Supabase Dashboard

4. **URL Configuration**
   - Navigate to: Authentication > URL Configuration
   - Set Site URL to your production domain
   - Add redirect URLs for all environments (development, staging, production)

### Storage Security
- All storage buckets have RLS enabled
- File size limits are enforced client-side
- Image compression is applied before upload
- File type validation prevents malicious uploads

## Rate Limiting

Client-side rate limiting is available via `checkRateLimit()` in `src/utils/security.ts`:
- Tracks requests per key (e.g., email address, IP)
- Configurable request limits and time windows
- Can be applied to authentication endpoints to prevent brute force attacks

**Future Enhancement:** Consider implementing rate limiting on sign-in, sign-up, and password reset operations.

## Authentication Flow Security

### Sign Up
1. Client validates email format and password strength
2. Password strength is verified against complexity requirements
3. Supabase creates user account with hashed password
4. Verification email sent with secure token
5. User must confirm email before full access (production)

### Sign In
1. Client validates credentials format
2. Password strength is checked (prevents weak legacy passwords)
3. Supabase verifies credentials
4. Session tokens issued with automatic refresh
5. Failed attempts could be rate-limited (recommended enhancement)

### Password Reset
1. User requests reset via email
2. Secure token sent via email
3. Token validated on reset page
4. New password must meet complexity requirements
5. User signed out after successful reset (forces re-authentication)

## File Upload Security

### Avatar Uploads
- File size limit: 5MB (compressed)
- Allowed formats: JPEG, PNG, GIF, WebP
- Images are compressed before upload to reduce storage costs
- Files stored in user-specific folders
- Bucket is public for display purposes

### Note Attachments
- Similar validation as avatars
- Additional file type restrictions
- Scanned for potentially malicious content via file type validation

## XSS Prevention

### Markdown Rendering
- Notes use markdown rendering (safer than raw HTML)
- Current implementation: Marked.js with default sanitization
- **Future Enhancement:** If HTML rendering is required, integrate DOMPurify for additional sanitization

### User Input Display
- All user inputs are sanitized before display
- React's default escaping prevents most XSS attacks
- Additional sanitization applied via `sanitizeHtml()` function

## SQL Injection Prevention

- **Primary Defense:** Supabase client uses parameterized queries
- All database operations use the Supabase SDK, which automatically prevents SQL injection
- No raw SQL queries are constructed with user input

## CSRF Protection

- Supabase handles CSRF protection automatically
- Session tokens include CSRF protection
- All state-changing operations require valid session tokens

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. Contact the development team directly at: [your-security-email@example.com]
3. Include detailed steps to reproduce the issue
4. Allow reasonable time for a fix before public disclosure

## Security Checklist for Developers

When adding new features:

- [ ] Input validation implemented (client and server)
- [ ] RLS policies created for new tables
- [ ] User data isolated by user ID
- [ ] Sensitive data not logged to console
- [ ] File uploads validated for type and size
- [ ] URLs validated before external API calls
- [ ] Password requirements enforced
- [ ] Session handling follows best practices
- [ ] Error messages don't expose sensitive information

## Best Practices for Developers

1. **Never hardcode secrets** - Use environment variables
2. **Validate all inputs** - Never trust user input
3. **Use centralized validation** - Import from `src/utils/security.ts`
4. **Follow RLS patterns** - Ensure user data isolation
5. **Test security features** - Include security test cases
6. **Keep dependencies updated** - Regular security audits
7. **Review Supabase policies** - Ensure they match business logic
8. **Minimize data exposure** - Only query necessary fields
9. **Log security events** - Use `logSecurityEvent()` for auditing
10. **Clean sensitive data** - Remove from localStorage when done

## Compliance

This application follows security best practices including:
- OWASP Top 10 protection
- Principle of least privilege
- Defense in depth
- Secure by default configuration

## Updates and Maintenance

This security policy is reviewed and updated:
- When new features are added
- After security incidents
- Quarterly as a scheduled review
- When dependencies are updated

Last updated: 2025-01-25
