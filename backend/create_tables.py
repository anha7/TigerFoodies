import os
import psycopg2

#-----------------------------------------------------------------------

# Obtain database URL
DATABASE_URL = os.environ['DATABASE_URL']

#-----------------------------------------------------------------------

def main():
    # Connect to the database
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cursor:
            # Create the users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                        net_id CHAR(6) PRIMARY KEY NOT NULL,
                        full_name VARCHAR(100) NOT NULL,
                        email VARCHAR(100) UNIQUE NOT NULL,
                        dietary_preferences VARCHAR[] DEFAULT '{}',
                        allergies VARCHAR[] DEFAULT '{}',
                        subscribed_to_text_notifications BOOLEAN DEFAULT FALSE,
                        phone_number VARCHAR(20) DEFAULT '',
                        subscribed_to_desktop_notifications BOOLEAN DEFAULT FALSE
                );
            ''')
            print("Successfully created users table!")

            # Create the food cards table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS cards (
                        card_id SERIAL PRIMARY KEY NOT NULL,
                        net_id CHAR(6) REFERENCES users(net_id) NOT NULL,
                        title VARCHAR(100) NOT NULL,
                        description VARCHAR(250),
                        photo_url VARCHAR(255),
                        location VARCHAR(255) NOT NULL,
                        dietary_tags VARCHAR[] DEFAULT '{}',
                        allergies VARCHAR[] DEFAULT '{}',
                        expiration TIMESTAMP NOT NULL,
                        posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP
                );
            ''')
            print("Successfully created food cards table!")

            # Create the comment table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS comments(
                        comment_id SERIAL PRIMARY KEY NOT NULL,
                        card_id INT REFERENCES cards(card_id) ON DELETE CASCADE NOT NULL,
                        net_id CHAR(6) REFERENCES users(net_id) NOT NULL,
                        comment VARCHAR(100) NOT NULL,
                        posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP
                );          
            ''')
            print("Successfully created comments table!")

            # Confirm that the tables were created successfully
            print('Created tables successfully!')

#-----------------------------------------------------------------------

if __name__ == '__main__':
    main()
