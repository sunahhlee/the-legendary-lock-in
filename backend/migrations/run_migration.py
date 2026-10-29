import os
import sys
import psycopg2
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, ".env"))

raw_db_url = os.getenv("SUPABASE_DB_URL")
if not raw_db_url:
    print("Error: SUPABASE_DB_URL is not set in backend/.env")
    sys.exit(1)

# Clean parameters for psycopg2 (remove Supabase pooler custom query params like ?supa=base-pooler.x)
parsed = urlparse(raw_db_url)
conn_kwargs = {
    "user": parsed.username,
    "password": parsed.password,
    "host": parsed.hostname,
    "port": parsed.port or 5432,
    "dbname": parsed.path.lstrip("/"),
    "sslmode": "require",
}

migration_file = os.path.join(backend_dir, "migrations", "001_initial_schema.sql")
with open(migration_file, "r") as f:
    sql = f.read()

print(f"Connecting to host {conn_kwargs['host']}:{conn_kwargs['port']}...")
try:
    conn = psycopg2.connect(**conn_kwargs)
    conn.autocommit = True
    with conn.cursor() as cursor:
        print(f"Executing migration: {migration_file}...")
        cursor.execute(sql)
        print("Migration executed successfully!")
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'food_templates', 'daily_logs', 'meal_entries')
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Verified tables in database: {tables}")
        
    conn.close()
except Exception as e:
    print(f"Migration failed: {e}")
    sys.exit(1)
