#!/usr/bin/env bash
# Resets the LOCAL development database to a clean, empty state.
# Deletes all data in docflow_db. Stop the backend before running this.
# On the next `./gradlew bootRun`, Flyway recreates the tables and the dev
# seeder adds the demo accounts and sample documents.

set -euo pipefail

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="docflow_db"
DB_USER="docflow_user"
DB_PASSWORD="docflow_password"

PG_CONN=(--host="$DB_HOST" --port="$DB_PORT")

# Create the application role if it doesn't exist yet (e.g. on a fresh machine).
role_exists=$(psql "${PG_CONN[@]}" --dbname=postgres --tuples-only --no-align \
  --command="SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'")
if [[ "$role_exists" != "1" ]]; then
  echo "Creating role $DB_USER..."
  psql "${PG_CONN[@]}" --dbname=postgres --quiet \
    --command="CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD'"
fi

echo "Dropping database $DB_NAME (if it exists)..."
dropdb "${PG_CONN[@]}" --if-exists --force "$DB_NAME"

echo "Creating database $DB_NAME owned by $DB_USER..."
createdb "${PG_CONN[@]}" --owner="$DB_USER" "$DB_NAME"

echo "Done. Start the backend with ./gradlew bootRun to recreate tables and demo data."
