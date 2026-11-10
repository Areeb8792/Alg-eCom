# Algions Platform — AI Attribution, External Assets & Dependencies

## 1. AI Assistance Disclosure
In accordance with Algions AI Labs assessment guidelines and academic integrity standards, this implementation was engineered with the assistance of an advanced AI coding assistant (**Antigravity / Gemini 3.8 Flash**).

### Scope of AI Contribution:
1. **Scaffolding & Architecture**: Structuring the monorepo workspace, generating boilerplate configuration for TypeScript, Tailwind, Docker, and Nginx.
2. **API & Database Implementation**: Authoring Express routing, Zod validation schemas, SQL schema migrations, and transactional idempotency logic.
3. **Frontend Integration**: Translating the supplied Superdesign HTML/CSS draft into modular React components while preserving 100% design fidelity.
4. **DevOps & Scripting**: Writing multi-stage Dockerfiles, Docker Compose orchestrations, bash automation scripts, and GitHub Actions workflows.
5. **Documentation**: Structuring the comprehensive documentation suite, runbooks, and test plans.

All code, schemas, and configurations were verified for correctness, type integrity, security boundaries, and test execution.

---

## 2. External Libraries & Third-Party Dependencies

### Backend Tier (`apps/api`):
- `express`: Fast, minimalist web framework.
- `pg`: Non-blocking PostgreSQL client and connection pooling.
- `zod`: TypeScript-first schema validation.
- `pino` & `pino-http`: High-performance structured JSON logger with field redaction.
- `jsonwebtoken`: Cryptographic JWT signing and verification.
- `bcryptjs`: Password hashing with salt.
- `uuid`: RFC4122 UUID generation.
- `vitest` & `supertest`: Unit and HTTP integration testing.

### Frontend Tier (`apps/web`):
- `react` & `react-dom`: Component tree rendering.
- `vite`: Build tooling and HMR dev server.
- `tailwindcss`: Utility-first CSS framework.
- `lucide-react`: Lightweight, accessible SVG icons.

### Infrastructure & Reverse Proxy:
- `nginx:alpine`: Lightweight reverse proxy and static asset delivery.
- `postgres:16-alpine`: Relational database container.

---

## 3. Visual Assets & Fonts Attribution
- **Fonts**:
  - `Anton` by Vernon Adams (Google Fonts, Open Font License).
  - `Space Grotesk` by Florian Karsten (Google Fonts, Open Font License).
- **Images**:
  - Luxury editorial fashion photography sourced from **Unsplash** (per the Superdesign draft reference).
- **Textures**:
  - Embedded SVG fractal noise grain filter overlay.
