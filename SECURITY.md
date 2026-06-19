# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving security patches depends on the project's versioning scheme:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in HooksDream, please follow these steps:

### 1. Do NOT create a public issue

Security vulnerabilities should be reported privately to prevent exploitation before a fix is available.

### 2. Send a detailed report

Email us at **security@hooksdream.dev** with the following information:

- **Type of vulnerability** (e.g., SQL injection, XSS, CSRF, authentication bypass, etc.)
- **Affected component** (frontend, backend, Python backend, specific endpoint)
- **Steps to reproduce** the vulnerability
- **Proof of concept** (code, screenshots, or video)
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)

### 3. What to expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Initial assessment**: We will provide an initial assessment within 7 days
- **Regular updates**: We will keep you informed of the progress towards a fix
- **Credit**: We will credit you for the discovery (unless you prefer to remain anonymous)

### 4. Disclosure timeline

- **Day 0**: Vulnerability reported
- **Day 1-7**: Initial assessment and confirmation
- **Day 7-30**: Development and testing of fix
- **Day 30-90**: Patch release and public disclosure

We ask that you give us reasonable time to fix the issue before public disclosure.

## Security Best Practices

When contributing to HooksDream, please follow these security best practices:

### For All Contributors

- **Never commit secrets or credentials** (API keys, passwords, tokens, private keys)
- **Use environment variables** for sensitive configuration
- **Validate all user input** on both client and server side
- **Use parameterized queries** to prevent SQL/NoSQL injection
- **Implement proper authentication and authorization** checks
- **Use HTTPS** in production environments
- **Keep dependencies up to date** and audit for vulnerabilities

### For Backend (Node.js)

- Use `bcrypt` or similar for password hashing
- Implement rate limiting to prevent brute force attacks
- Validate and sanitize all incoming data
- Use JWT with appropriate expiration times
- Implement CORS properly
- Use helmet.js for security headers
- Log security events without exposing sensitive data

### For Frontend (React)

- Sanitize user-generated content before rendering
- Use HTTPS for all API calls
- Implement proper token storage (httpOnly cookies preferred)
- Validate data on the client side (but never trust it)
- Use Content Security Policy (CSP)
- Avoid XSS vulnerabilities (don't use `dangerouslySetInnerHTML` without sanitization)

### For Python Backend

- Use environment variables for secrets
- Validate all input data with Pydantic
- Implement proper error handling (don't expose stack traces)
- Use parameterized queries
- Implement rate limiting
- Keep FastAPI and dependencies updated

## Known Security Considerations

### Authentication
- JWT tokens are used for authentication
- OTP verification is implemented for sensitive operations
- Passwords are hashed before storage

### Data Protection
- User passwords are never stored in plain text
- Sensitive data is encrypted at rest
- API keys and secrets are stored in environment variables

### API Security
- Rate limiting is implemented to prevent abuse
- CORS is configured to allow only trusted origins
- Input validation is performed on all endpoints
- SQL/NoSQL injection prevention via Mongoose

### Infrastructure
- Deployed on Railway with automatic HTTPS
- MongoDB connection uses SSL/TLS
- Cloudinary handles secure media storage
- Environment variables are not committed to version control

## Security Audit

We periodically conduct security audits of our codebase. If you're interested in helping with security audits, please reach out to us.

## Bug Bounty

Currently, we do not have a formal bug bounty program. However, we deeply appreciate security researchers who report vulnerabilities responsibly. We will acknowledge your contribution in our security hall of fame (if you wish) and provide a shout-out on our social media channels.

## Contact

For security issues, please email: **abdolhamid.dev@gmail.com**

For general questions:
- 💼 LinkedIn: [www.linkedin.com/in/hamidabdol](https://www.linkedin.com/in/hamidabdol)
- 📧 Email: [abdolhamid.dev@gmail.com](mailto:abdolhamid.dev@gmail.com)
- 🌐 Portfolio: [https://hamid.id.vn](https://hamid.id.vn)

---

Thank you for helping keep HooksDream and our community safe! 🔒