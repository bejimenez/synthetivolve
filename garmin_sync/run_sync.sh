#!/bin/bash

# This makes the script's paths relative to its own location,
# not where you run it from. This is essential for cron jobs.
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# --- 1. Run the GarminDB update ---
echo "[$(date)] Starting GarminDB Update..."
# NOTE: garmindb_cli.py must be in your system's PATH, which it should be
# if you installed it via pip as recommended.
garmindb_cli.py --all --download --import --analyze --latest

# --- 2. Run the Supabase Sync Script ---
echo "[$(date)] Starting Supabase Sync..."
# We run the python script using its full path, which we determined above.
python3 "$SCRIPT_DIR/sync_to_supabase.py"

echo "[$(date)] Sync Complete."