# PostgreSQL migration runbook

**Current verification state (2026-11-16):** V1–V4 are present in the repository. Their complete execution and Hibernate schema validation have **not** been verified against PostgreSQL for the current worktree. The existing UPIQ database has not been migrated by this work. Do not infer successful migration from unit tests or application source.

This runbook is a controlled manual procedure. Never point a migration-enabled application or command at an existing database until the schema has been independently compared, a restorable backup has been tested, and a database operator has approved the plan.

## Migration inventory

| Version | File | Purpose and safeguards |
|---|---|---|
| V1 | `backend/src/main/resources/db/migration/V1__initial_schema.sql` | Fresh-install users, categories, and transactions schema. `transactions.amount` starts as `double precision` because V1 models the inspected pre-migration schema. Transaction/category `user_id` ownership is enforced by application queries; V1 does not add user foreign keys to those two legacy tables. |
| V2 | `backend/src/main/resources/db/migration/V2__transaction_amount_numeric_19_2.sql` | Checks existing amounts for null, non-finite, nonpositive, out-of-range, and more-than-two-decimal values; aborts if any fail; converts to `NUMERIC(19,2)`. |
| V3 | `backend/src/main/resources/db/migration/V3__normalize_and_uniquely_index_user_emails.sql` | Rejects case-insensitive trimmed collisions, normalizes stored email values, and creates a unique index on `lower(btrim(email))`. Existing case-sensitive email uniqueness remains. |
| V4 | `backend/src/main/resources/db/migration/V4__user_budgets_and_persistent_notifications.sql` | Adds `budgets` and `notifications`, each with an identity primary key and `user_id` foreign key to `users(id) ON DELETE CASCADE`. Budgets have positive amount/month-start/nonblank-category checks, separate total/category monthly uniqueness indexes, and a user-period lookup index. Notifications have per-user event-key uniqueness plus inbox and unread lookup indexes. |

The service layer also queries financial data by the authenticated principal's user ID. The V4 foreign keys protect the new budget/notification ownership relationships at the database level; the legacy transaction/category ownership model remains application-enforced.

## Fresh installation

1. Provision a new empty PostgreSQL 16 database and a dedicated application role using an approved secret manager or local development secret handling.
2. Confirm the target database is empty and is not an existing UPIQ database or volume.
3. Start the application with the intended Spring profile and required datasource/JWT/CORS settings. Flyway should apply V1, V2, V3, and V4 in order before Hibernate checks the mapping.
4. Confirm all four versions are recorded successful in `flyway_schema_history`; verify tables, constraints, indexes, identity sequences, and row counts.
5. Confirm application startup completes with Hibernate `ddl-auto: validate`. A Maven `BUILD SUCCESS` without the Spring startup message is not sufficient.
6. Run decimal round-trip and synthetic two-user ownership checks against that disposable database. Do not use real user financial data.

Fresh V1–V4 and Hibernate validation remain outstanding verification gates for this worktree.

## Existing pre-Flyway installation

Do **not** run V1 against an existing application schema. The intended legacy path is to compare the existing schema with V1, manually baseline Flyway at version 1, and then run V2, V3, and V4 in order.

1. Schedule an approved maintenance window. Take a PostgreSQL-consistent backup through the approved secret/connection mechanism; do not place credentials in command history, source, or logs.
2. Restore the backup to a disposable PostgreSQL 16 database and verify schema and row counts. Do not use the live database or its volume as a test target.
3. Compare the existing schema with V1: table and column names, types, precision/scale, nullability, identity/sequence configuration, unique/check constraints, indexes, and relationships. A Flyway baseline marker does not perform this comparison. If the schema differs, stop and prepare a reviewed reconciliation plan.
4. Run the V2 amount precondition checks and V3 email-collision check on the isolated copy. The migrations repeat these guards and remain authoritative. Do not deduplicate records to force a migration through.
5. With the database operator's approval, manually run `flyway baseline -baselineVersion=1` using protected configuration and verify the history record. Do not enable `baseline-on-migrate` in application configuration.
6. On the disposable baseline copy, apply V2, V3, and V4. Confirm every migration version succeeds and verify all new V4 ownership, uniqueness, and lookup objects.
7. Start the backend against that copy. Verify Flyway status, successful application startup, and Hibernate `ddl-auto: validate`.
8. Perform the post-migration checks below before deciding whether a production rollout is approved.

The existing database has not been schema-compared or baselined by this work. This procedure must not be interpreted as authorization to migrate it.

## Pre-migration checks

- Confirm database identity, PostgreSQL major version, role privileges, current schema, and Flyway history using read-only checks.
- Verify the backup can be restored to a separate target and that its row counts/schema match the source baseline; do not print row-level financial data.
- Check amount conversion preconditions (including non-finite values, positivity, supported range, and scale) and normalized email collisions. V2/V3 abort when their guards fail.
- Compare V1 mappings and V4 entity/table names, field types, lengths, nullability, indexes, and foreign keys. Resolve drift before baseline or migration.
- Confirm no other application instance is concurrently applying migrations.

## Post-migration checks

- Confirm Flyway history contains the expected successful versions (V1–V4 for fresh install; baseline 1 followed by V2–V4 for the legacy path).
- Confirm PostgreSQL schema objects and Hibernate `ddl-auto: validate` startup success.
- Verify user, transaction, and category counts; identity/sequence next values; import identity uniqueness; amount count/scale/range; and independent decimal income/expense totals.
- For V3, verify normalized email lookup and case-insensitive uniqueness with synthetic test records.
- For V4, verify budget create/read/update/delete, period/category uniqueness, notification insert-once/read/dismiss behavior, and user isolation with two synthetic users. Confirm the user foreign-key cascade semantics in a disposable database.
- Recheck the application health endpoint and authenticated API behavior on the isolated deployment before routing traffic.

## Hibernate and application configuration

All current Spring profiles configure Hibernate `ddl-auto: validate`; Hibernate must not create or update schema. Flyway owns schema creation and changes. Fresh installations are intended to run all four migrations. Existing installations need a reviewed V1 comparison and explicit version-1 baseline before the later migrations. Automatic baseline-on-migrate is not configured.

Production requires externally supplied datasource credentials, JWT key, and explicit CORS origins. Do not use development fallbacks for production. Keep server secrets out of frontend variables and logs.

## Recovery and rollback

A deployment rollback does not roll back schema changes. Before a production migration, retain a verified backup and approved point-in-time recovery marker. If a migration or post-migration check fails, pause rollout/writes as approved and restore or recover to a separate target first. Do not run Flyway `clean`, drop migration history, manually reverse `NUMERIC(19,2)`, or alter/delete data to force startup. Preserve the failure and migration history for investigation. Decide in advance with the database operator whether in-place restore is allowed.
