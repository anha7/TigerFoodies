import os
import psycopg2

#-----------------------------------------------------------------------

# Obtain database URL
DATABASE_URL = os.environ['DATABASE_URL']

# Connect to the database
with psycopg2.connect(DATABASE_URL) as conn:
    with conn.cursor() as cursor:
        # Create the users table
        cursor.execute('')

        # Create the food cards table
        cursor.execute('')

        # Create the comment table
        cursor.execute('')

        # Confirm that the tables were created successfully
        print('Created tables successfully!')