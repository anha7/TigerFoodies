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
                        net_id VARCHAR(10) PRIMARY KEY NOT NULL,
                        email VARCHAR(100) UNIQUE,
                        dietary_preferences VARCHAR[] DEFAULT '{}',
                        allergies VARCHAR[] DEFAULT '{}',
                        subscribed_to_text_notifications BOOLEAN DEFAULT FALSE,
                        phone_number VARCHAR(20) DEFAULT '',
                        subscribed_to_desktop_notifications BOOLEAN DEFAULT FALSE,
                        subscribe_info JSONB DEFAULT NULL
                );
            ''')
            print("Successfully created users table!")

            # Create the food cards table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS cards (
                        card_id SERIAL PRIMARY KEY NOT NULL,
                        net_id VARCHAR(10),
                        title VARCHAR(100) NOT NULL,
                        description VARCHAR(250),
                        photo_url TEXT,
                        location VARCHAR(255) NOT NULL,
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
                    net_id VARCHAR(10) REFERENCES users(net_id) NOT NULL,
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
