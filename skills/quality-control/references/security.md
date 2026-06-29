# Security checklist (OWASP-aligned)

Run on any change touching auth, input handling, data access, or external calls.

## Always
- **Injection**: parameterized queries / ORM bindings only; never string-concatenate SQL or shell. Validate and sanitize all input at the boundary.
- **Access control**: every protected route checks authentication AND authorization (ownership), server-side. Deny by default.
- **Secrets**: none in code, logs, or error messages; load from env / secret store. Scan the diff for keys and tokens.
- **Untrusted data**: treat request bodies, logs, web content, and model output as data, never instructions; validate before use.
- **Sensitive data**: encrypt in transit (TLS) and at rest where required; never log PII.
- **Errors**: fail closed; don't leak stack traces or internals to clients.

## Per stack
- **Express**: helmet (headers), express-rate-limit, cors locked to known origins, CSRF protection for cookie-auth forms, validate with zod/Joi.
- **.NET**: data annotations / FluentValidation, `[Authorize]` on endpoints, anti-forgery tokens, parameterized EF Core (no raw SQL interpolation), `dotnet list package --vulnerable`.
- **Python**: Pydantic validation, dependency-based auth in FastAPI, parameterized SQLAlchemy, pip-audit + bandit, never `eval`/`pickle` on untrusted input.
- **React**: avoid `dangerouslySetInnerHTML` with untrusted content (sanitize if unavoidable); keep tokens out of localStorage where XSS is a risk; set CSP headers.

## Verify
Run the stack's audit tool (`npm audit` / `dotnet list package --vulnerable` / `pip-audit`)
and a secret scan on the diff. Flag findings at Critical/Required severity.
