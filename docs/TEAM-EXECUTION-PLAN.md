# WOW Platform - Team Execution Plan

## Purpose
This document captures required tasks, effort estimates, and pending development so backend, frontend, mobile, DevOps, QA, and product teams can start execution immediately.

## 1) Target Architecture (Full Separation)

### Services
- Backend API service: NestJS (stateless), deployed independently.
- Frontend web service: React + Vite, deployed independently.
- Mobile app service: React Native app (Android first, iOS next), consuming same backend APIs.

### Data and infra (separate managed services)
- PostgreSQL: transactional domain data (auth, matchmaking, planner, bookings, events, finance).
- MongoDB: chat/messages, unstructured content.
- Redis: cache, session/refresh token support, rate limiting, queues.
- Object storage: media uploads (profile images, docs, memories).

## 2) Current State (What Exists)
- Backend modules exist for auth, users, matchmaking, chat, vendors, planner, bookings, events, honeymoon, finance, notifications.
- Frontend pages exist for most major journeys.
- Swagger setup exists.
- Docker compose exists for postgres/mongodb/redis/backend/frontend.
- Local backend currently runs with SQLite (`better-sqlite3`, `synchronize: true`) and needs migration to separated DB setup for team/prod readiness.
- Notifications service is placeholder (console only).

## 3) Pending Development Backlog (By Track)

### Track A - Backend Platform and Service Hardening
1. Replace SQLite runtime with env-driven DB config for PostgreSQL in non-local environments.
2. Add DB migration strategy (TypeORM migrations), remove `synchronize: true` outside local dev.
3. Separate config profiles (`local`, `dev`, `staging`, `prod`) and strict env validation.
4. Add centralized logging, tracing, and request correlation IDs.
5. Add global error format contract and API versioning strategy.
6. Implement rate limiting, brute-force protection, and security headers.
7. Add background jobs/queue for notifications and heavy workflows.
8. Introduce file upload service (S3-compatible) with signed URL flow.

Effort: 5-7 person-weeks.

### Track B - Data Layer and Database Readiness
1. Data model review across modules with normalized PostgreSQL schema.
2. Chat persistence and indexing strategy in MongoDB.
3. Redis keys strategy, cache invalidation policy, TTL matrix.
4. Seed scripts for non-prod environments.
5. Backup/restore runbooks and data retention policy.
6. Query/index tuning for high-traffic APIs (search, chat, vendors, planner timeline).

Effort: 4-6 person-weeks.

### Track C - Core Feature Completion (Pending Functional Work)
1. Notifications integration: push (FCM/APNs), email, SMS providers.
2. Payment integration: provider selection, escrow/release/refund workflow hardening.
3. Admin capabilities: user/vendor moderation, dispute management, reporting dashboards.
4. Media and memories module: upload, gallery, moderation rules.
5. AI recommendations (phase 1): matchmaking/vendor suggestion scoring and explainability fields.
6. Recover-password and account security flows (OTP/email verification, device/session management).
7. Role-based flows validation for all roles (user, vendor, admin, planner).

Effort: 8-12 person-weeks.

### Track D - Frontend Web Completion
1. Production-grade API integration for all pages (remove mock/placeholder behavior if present).
2. Error/loading empty states and optimistic updates.
3. Form validation and field-level UX consistency.
4. End-to-end auth guard behavior and token refresh edge cases.
5. Accessibility baseline (keyboard navigation, labels, contrast).
6. Performance optimization (route splitting, lazy loading, image optimization).
7. Admin web console screens.

Effort: 5-8 person-weeks.

### Track E - Mobile Application (New Delivery)
1. Decide stack: React Native + Expo (recommended for faster delivery).
2. App shell: auth, navigation, secure token storage.
3. Core screens v1: Login/Register, Dashboard, Matches, Chat, Vendors, Planner tasks, Profile.
4. Push notifications integration with backend event triggers.
5. Offline support for chat/task reads and queued retries for write operations.
6. Device QA matrix and store release preparation (Android first).

Effort: 10-14 person-weeks.

### Track F - DevOps, Security, and Environment Management
1. CI pipelines: lint, test, build, migration check, security scan.
2. CD pipelines: backend and frontend separate release workflows.
3. Environment provisioning (dev/staging/prod), secret management, config maps.
4. Observability stack: logs, metrics, alerts, uptime checks.
5. API gateway/domain/TLS setup and CORS policy by environment.
6. Cost and scaling guardrails.

Effort: 4-6 person-weeks.

### Track G - QA and Release Readiness
1. Test strategy: unit, integration, contract, E2E (web + API + mobile smoke).
2. Regression suite for critical journeys:
   - register/login
   - profile setup
   - match interest/accept/reject
   - chat send/receive/read
   - planner task lifecycle
   - booking and payment states
3. Test data management and environment reset scripts.
4. UAT checklist and release sign-off template.

Effort: 4-6 person-weeks.

## 4) Recommended Team Structure
- 1 Technical Lead / Architect
- 2 Backend engineers
- 1 Data engineer / DBA-capable backend engineer
- 2 Frontend web engineers
- 2 Mobile engineers
- 1 DevOps engineer
- 1 QA automation engineer
- 1 Product manager + 1 UX designer (shared)

## 5) High-Level Effort Summary
- Total estimated effort: 40-59 person-weeks.
- With parallel teams (8-10 engineers), expected timeline: 12-16 weeks to production-ready v1.

## 6) Suggested Delivery Phases

### Phase 0 (Week 1-2) - Foundation
- Finalize architecture and ownership.
- Lock environments and CI/CD baseline.
- Complete DB migration and config separation.

### Phase 1 (Week 3-6) - Core Stability
- Harden backend and data layer.
- Complete web integration for core journeys.
- Start mobile app shell and authentication.

### Phase 2 (Week 7-10) - Feature Completion
- Notifications, payments, admin basics.
- Mobile core features (matches/chat/planner/profile).
- Expand QA automation.

### Phase 3 (Week 11-14) - Production Readiness
- Security hardening, load/performance checks.
- UAT and bug bash.
- Release candidate and runbooks.

### Phase 4 (Week 15-16) - Launch and Hypercare
- Controlled launch.
- Monitoring and incident response playbook.
- Post-launch fixes and backlog reprioritization.

## 7) Ownership Matrix (Initial)
- Backend Lead: Track A, C (API side), API contracts.
- Data Lead: Track B and schema migrations.
- Frontend Lead: Track D and web release quality.
- Mobile Lead: Track E and app store readiness.
- DevOps Lead: Track F and platform reliability.
- QA Lead: Track G and release gates.
- Product/PM: scope, prioritization, acceptance criteria.

## 8) Immediate Action List (Next 10 Working Days)
1. Freeze API contract v1 for web/mobile consumption.
2. Switch backend to env-driven DB config and create first migration set.
3. Stand up dev/staging env with separate DB instances.
4. Create Jira board/epics from this document.
5. Define DoD for each module (code, tests, docs, observability).
6. Begin mobile scaffold and authentication flow.
7. Implement notification provider adapter interfaces.
8. Prepare E2E smoke tests for auth, match, chat.

## 9) Definition of Done (DoD)
A task is complete only when:
- Code merged with review approval.
- Automated tests added/updated and passing.
- API/docs updated (Swagger + changelog).
- Observability added for critical paths.
- Security and error handling verified.
- QA acceptance passed in staging.

## 10) Risks and Mitigations
- Risk: unclear ownership across many modules.
  - Mitigation: one accountable owner per track and weekly architecture review.
- Risk: data model churn during feature development.
  - Mitigation: migration-first process and schema review gate.
- Risk: mobile blocked by unstable APIs.
  - Mitigation: contract freeze + versioned endpoints.
- Risk: payment/notification third-party delays.
  - Mitigation: provider abstraction and mock adapters from day 1.

## 11) Shareable Checklist (for Team Kickoff)
- [ ] Architecture and service boundaries approved.
- [ ] Environment strategy approved (dev/stage/prod).
- [ ] Track owners assigned.
- [ ] Sprint 1 backlog committed.
- [ ] Test strategy approved.
- [ ] Release criteria agreed.
