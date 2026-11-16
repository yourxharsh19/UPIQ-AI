# PostgreSQL migration runbook

This runbook is a manual deployment procedure. It has not been executed against the existing UPIQ database. Do not point a migration command at the currently running production or developer database until its schema has been independently verified and a restorable backup is available.

## Migration sequence

Flyway migrations are applied in order:

1. `V1__initial_schema.sql` creates the inspected legacy schema for a fresh database. `transactions.amount` is `double precision` in this baseline schema.
2. `V2__transaction_amount_numeric_19_2.sql` checks every existing transaction amount for null, non-finite, nonpositive, out-of-range, and over-two-decimal values, then converts the column to `numeric(19,2)`. It aborts without converting if any row fails a check.
3. `V3__normalize_and_uniquely_index_user_emails.sql` aborts if trimmed, case-insensitive email collisions exist, normalizes existing email strings, and adds a unique index on `lower(btrim(email))`.

Fresh installations run all three migrations automatically at startup. Existing installations must not run V1 over their schema. They must be baselined at version 1 only after the schema has been compared to V1, then run V2 and V3.

## Existing installation procedure

1. Schedule a maintenance window and take a PostgreSQL-consistent backup using the approved secret manager/connection configuration. Example: `pg_dump --format=custom --file=<protected-backup-path> <database-connection>`. Keep the dump encrypted and access-controlled; do not put connection credentials in shell history or logs.
2. Verify the backup by restoring it to a disposable isolated PostgreSQL 16 database and checking table/row counts. Do not use the live database or its volume as a test target.
3. Compare the existing schema against `V1__initial_schema.sql`: tables, columns, types, precision, nullability, identity behavior, constraints, and indexes. A Flyway baseline marker does not perform this comparison. If the schema differs, stop and prepare a reviewed reconciliation migration instead of baselining.
4. Check the database for case-insensitive trimmed email collisions and check the transaction amount preconditions from V2. The migration repeats these guards and remains authoritative. Do not deduplicate transactions.
5. Using Flyway CLI configured through protected environment/configuration (never command-line password arguments), run `flyway baseline -baselineVersion=1` against the verified database. Confirm `flyway_schema_history` records the baseline at version 1. Do not enable `baseline-on-migrate` in application configuration.
6. Deploy the migration-enabled application with the production profile and externally provisioned database/JWT/CORS configuration. Flyway applies V2 and V3; Hibernate runs in `validate` mode after migration.
7. Verify transaction and user row counts, identity/sequence next values, duplicate import-identity behavior, amount count/scale/range, and independent income/expense totals before restoring traffic. Monetary checks must use decimal arithmetic; do not print row-level financial data.

## Fresh installation procedure

Provision a new empty PostgreSQL 16 database with the required application credentials, then start the migration-enabled application. Flyway creates V1 and applies V2/V3. Confirm the three migration versions are successful and that Hibernate validation completes. Do not enable automatic baseline behavior for an empty database.

## Recovery and rollback

Take a verified backup and provider/database point-in-time recovery marker before migration. A deployment rollback alone is not a schema rollback: the new application expects `numeric(19,2)` and the email expression index. If migration or post-migration verification fails, keep writes paused and restore the backup/PITR copy to a separate recovery target, validate it, then decide with the database operator whether to restore in place. Do not drop the Flyway history table, run `clean`, manually reverse the amount type, or alter/delete records to make the application start. Preserve the migration failure and schema history for diagnosis.

## Application schema mode

All current Spring profiles use Hibernate `ddl-auto: validate`; Flyway owns schema creation and change. Existing local/research databases also need a reviewed baseline or a clean migrated database before application startup. Tests using mocks do not prove PostgreSQL migration compatibility. A fresh PostgreSQL migration/round-trip integration test remains a required release check before the existing database is baselined.
