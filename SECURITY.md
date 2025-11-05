# Security Policy

## Supported Versions

Currently supported versions of pdf-viewer-kit:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

*Note: As this is an early-stage library, we recommend always using the latest version.*

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in pdf-viewer-kit, please follow these steps:

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Use GitHub's private vulnerability reporting:
   - Go to the [Security tab](https://github.com/AmanKrr/pdf-viewer-kit/security/advisories)
   - Click "Report a vulnerability"
   - Fill out the private advisory form
3. Include the following details:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Response Time**: We aim to acknowledge reports within 48-72 hours
- **Updates**: You'll receive updates on the progress every 5-7 days
- **Resolution**: We'll work to patch critical vulnerabilities within 30 days
- **Credit**: Security researchers will be credited in the release notes (unless they prefer to remain anonymous)

### Disclosure Policy

- Please allow us reasonable time to fix the vulnerability before public disclosure
- We'll coordinate with you on the disclosure timeline
- We'll publish a security advisory once a fix is released

## Security Best Practices

When using pdf-viewer-kit:
- Keep the library updated to the latest version
- Validate and sanitize user-uploaded PDF files
- Be aware that PDFs can contain executable content - use in trusted environments
