#!/bin/sh
# Applies any pending database migrations, then hands over to the server.
#
# `migrate deploy` only ever applies migrations that are already committed — it never
# generates one, never prompts, and never drops anything. It is the command that is safe to
# run on every boot: if the database is already up to date it is a no-op.
#
# If it fails, we stop here rather than starting the app. A server running against a schema
# it doesn't understand produces corrupt data; a failed release just leaves the previous
# version serving traffic.
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "→ Applying database migrations…"
  npx prisma migrate deploy
  echo "✅ Database is up to date."
else
  echo "⚠️  DATABASE_URL is not set — skipping migrations. The app will serve demo data."
fi

exec "$@"
