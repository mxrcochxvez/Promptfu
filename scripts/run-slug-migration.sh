#!/bin/bash
# Script to run the slug migration in Neon
# Usage: ./scripts/run-slug-migration.sh

if [ -z "$VITE_DATABASE_URL" ]; then
  echo "Error: VITE_DATABASE_URL environment variable is not set"
  exit 1
fi

echo "Running slug migration..."
psql "$VITE_DATABASE_URL" -f db/migrations/add-slug-to-classes.sql

if [ $? -eq 0 ]; then
  echo "✓ Migration completed successfully!"
else
  echo "✗ Migration failed. Please check the error above."
  exit 1
fi

