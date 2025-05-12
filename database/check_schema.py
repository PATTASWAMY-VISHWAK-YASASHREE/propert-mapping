import psycopg2

# Connect to the database
conn = psycopg2.connect(
    dbname='property_mapping',
    user='postgres',
    password='vishwak',
    host='localhost'
)

# Create a cursor
cur = conn.cursor()

# Get table names
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
""")
tables = cur.fetchall()

print("Tables in database:")
for table in tables:
    print(f"- {table[0]}")
    
    # Get columns for each table
    cur.execute(f"""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '{table[0]}'
        ORDER BY ordinal_position
    """)
    columns = cur.fetchall()
    
    for column in columns:
        print(f"  * {column[0]} ({column[1]})")
    
    print()

# Close connection
conn.close()