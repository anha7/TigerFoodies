#-----------------------------------------------------------------------
# create_tables.py
# Authors: Anha Khan, Arika Hassan, Laiba Ali, Mark Gazzerro, Sami Dalu
#-----------------------------------------------------------------------

import os
import psycopg2
from dotenv import load_dotenv

#-----------------------------------------------------------------------

# Obtain database URL
load_dotenv()
DATABASE_URL = os.environ['DATABASE_URL']

#-----------------------------------------------------------------------

def main():
    # Connect to the database
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cursor:
            # Create the users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                        net_id VARCHAR(20) PRIMARY KEY NOT NULL
                );
            ''')
            print("Successfully created users table!")

            # Create the food cards table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS cards (
                        card_id SERIAL PRIMARY KEY,
                        net_id VARCHAR(20),
                        title VARCHAR(100) NOT NULL,
                        description VARCHAR(250),
                        photo_url TEXT,
                        location VARCHAR(255),
                        latitude DOUBLE PRECISION,
                        longitude DOUBLE PRECISION,
                        dietary_tags VARCHAR[] DEFAULT '{}',
                        allergies VARCHAR[] DEFAULT '{}',
                        expiration TIMESTAMP NOT NULL,
                        posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP,
                        FOREIGN KEY (net_id) REFERENCES users(net_id) ON DELETE CASCADE
                );
            ''')
            print("Successfully created food cards table!")

            # Create the comment table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS comments (
                    comment_id SERIAL PRIMARY KEY NOT NULL,
                    card_id INT REFERENCES cards(card_id) ON DELETE CASCADE NOT NULL,
                    net_id VARCHAR(20) REFERENCES users(net_id) NOT NULL,
                    comment VARCHAR(200) NOT NULL,
                    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );          
            ''')
            print("Successfully created comments table!")

            # Confirm that the tables were created successfully
            print('Created tables successfully!')

#-----------------------------------------------------------------------

if __name__ == '__main__':
    main()
