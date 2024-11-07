from flask import Flask, send_from_directory, jsonify, request, session
from dotenv import load_dotenv
import os
import psycopg2
import sys
import secrets

#-----------------------------------------------------------------------

# Initialize the database
load_dotenv()
DATABASE_URL = os.environ.get('DATABASE_URL')
conn = psycopg2.connect(DATABASE_URL)

# Initialize Flask app
app = Flask(__name__, static_folder='build', static_url_path='')

# Set up secret key
app.secret_key = secrets.token_hex(32)

#-----------------------------------------------------------------------

# Route to serve the React app's index.html
@app.route('/')
def serve():
    # Authenticate user when they access the site and store username
    session['username'] = 'ab123'
    add_user('ab123')
    return send_from_directory(app.static_folder, 'index.html')

# Route to serve static files (like CSS, JS, images, etc.)
@app.route('/static/<path:path>')
def serve_static_files(path):
    return send_from_directory(app.static_folder + '/static', path)

#-----------------------------------------------------------------------

# Add user the the database once they're CAS authenticated
def add_user(net_id):
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Execute query to add a user to the database
                cursor.execute('''
                    INSERT INTO users (net_id)
                    VALUES(%s)
                    ON CONFLICT (net_id) DO NOTHING;
                ''', (net_id,))

                # Commit to the database
                conn.commit()
    except Exception as ex:
        print(ex)

#-----------------------------------------------------------------------

# Retrieve current user's NetID
@app.route('/get_user')
def get_user():
    if 'username' in session:
        return jsonify({'net_id': session['username']})
    else:
        return ([False, 'User not logged in'])
    
#-----------------------------------------------------------------------

# Clean expired cards
def clean_expired_cards():
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM cards WHERE expiration <= NOW();
                """)
    except Exception as ex:
        print(str(ex))

#-----------------------------------------------------------------------

# API Route for fetching all active cards for the homepage
@app.route('/api/cards', methods=['GET'])
def get_data():
    try:
        # Clean expired cards before fetching data
        clean_expired_cards()

        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Execute query to retrieve all active cards information
                cursor.execute('''
                    SELECT card_id, title, photo_url, location, 
                    dietary_tags, allergies, description, posted_at
                    FROM cards;
                ''')
                rows = cursor.fetchall()

                # Package queried data and send it over
                cards = []
                for row in rows:
                    cards.append({
                        'card_id': row[0],
                        'title': row[1],
                        'photo_url': row[2],
                        'location': row[3],
                        'dietary_tags': row[4],
                        'allergies': row[5],
                        'description': row[6],
                        'posted_at': row[7]
                    })

                return jsonify(cards)
    except Exception as ex:
        print(ex)
        return jsonify([False, str(ex)])
        
#-----------------------------------------------------------------------
        
# API Route for retrieving cards for a specific user
@app.route('/api/cards/<string:net_id>', methods=['GET'])
def retrieve_user_cards(net_id):
    try:
        # Connect to the database a nd establish a cursor
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Define insertion query
                insertion_query = '''SELECT card_id, title, photo_url, 
                    location, dietary_tags, allergies, description, 
                    posted_at FROM cards
                    WHERE net_id = %s;
                '''
                            
                # Execute query to retrieve user's cards
                cursor.execute(insertion_query, [net_id])
                rows = cursor.fetchall()

                # Package queried data and send it over
                cards = []
                for row in rows:
                    cards.append({
                        'card_id': row[0],
                        'title': row[1],
                        'photo_url': row[2],
                        'location': row[3],
                        'dietary_tags': row[4],
                        'allergies': row[5],
                        'description': row[6],
                        'posted_at': row[7]
                    })

                return jsonify(cards)
    except Exception as ex:
        print(ex)
        return jsonify([False, str(ex)])

#----------------------------------------------------------------------- 

# API Route for deleting cards
@app.route('/api/cards/<int:card_id>', methods=['DELETE'])
def delete_card(card_id):
    try:
        # Connect to the database and establish a cursor
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Definie deletion query
                deletion_query = 'DELETE FROM cards WHERE card_id = %s;'

                # Execute query to delete a card with given card_id
                cursor.execute(deletion_query, [card_id])

                # Commit to the database
                conn.commit()
            return jsonify([True, 'Successfully removed the card!'])
    except Exception as ex:
        print(ex, file = sys.stderr)
        return jsonify([False, str(ex)])

#-----------------------------------------------------------------------
        
# API Route for creating cards
@app.route('/api/cards', methods=['POST'])
def create_card():
    try:
        # Retrieve JSON object containing new card data
        card_data = request.get_json()

        # Parse relevant fields
        net_id = card_data.get('net_id')
        title = card_data.get('title')
        description = card_data.get('description')
        photo_url = card_data.get('photo_url')
        location = card_data.get('location')
        dietary_tags = card_data.get('dietary_tags')
        allergies = card_data.get('allergies')

        # Package parse data
        new_card = [net_id, title, description, photo_url, location, 
                    dietary_tags, allergies]
        
        # Connect to database and establish a cursor
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                
                # Define insertion query
                insertion_query = '''INSERT INTO cards (net_id, 
                    title, description, photo_url, location, 
                    dietary_tags, allergies, expiration, posted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 
                    CURRENT_TIMESTAMP + interval \'3 hours\', 
                    CURRENT_TIMESTAMP)
                '''

                # Execute query to store new card into the database
                cursor.execute(insertion_query, new_card)

                # Commit to the database
                conn.commit()

                return jsonify([True, 'Successfully created a card!'])
    except Exception as ex:
        print(ex)
        return jsonify([False, str(ex)])

#-----------------------------------------------------------------------

# API Route for editing cards
@app.route('/api/cards/<int:card_id>', methods=['PUT'])
def edit_card(card_id):
    try:
        # Retrieve JSON object
        card_data = request.get_json()
        # Get relevant fields
        title = card_data.get('title')
        description = card_data.get('description')
        photo_url = card_data.get('photo_url')
        location = card_data.get('location')
        dietary_tags = card_data.get('dietary_tags')
        allergies = card_data.get('allergies')
        new_card = [title, description, photo_url, location, 
                    dietary_tags, allergies, card_id]
        
        # Connect to database
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Define update query
                update_query = 'UPDATE cards SET (title, description, photo_url,'
                update_query += ' location, dietary_tags, allergies, updated_at)'
                update_query += ' = (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)'
                update_query += ' WHERE card_id = %s'
                # Execute query to update row in the database
                cursor.execute(update_query, new_card)
                # Commit to database
                conn.commit()

                return jsonify([True, 'Successfully updated a card!'])
    except Exception as ex:
        print(ex)
        return jsonify([False, str(ex)])
        
# #-----------------------------------------------------------------------
        
# API Route for retrieving cards
@app.route('/api/cards/<int:card_id>', methods=['GET'])
def retrieve_card(card_id):
    try:
        # Connect to database
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Define insertion query
                retrieval_query = ''' SELECT card_id, title, description,
                    photo_url, location, dietary_tags, allergies 
                    FROM cards WHERE card_id = %s;'''
                # Execute query to retrieve card with given card_id
                cursor.execute(retrieval_query, [card_id])
                row = cursor.fetchone()
                if row:
                    card = {
                        "card_id": row[0],
                        "title": row[1],
                        "description": row[2],
                        "photo_url": row[3],
                        "location": row[4],
                        "dietary_tags": row[5],
                        "allergies": row[6]
                    }
                    return jsonify(card)
                else:
                    return jsonify({"error": "Card not found"}), 404

    except Exception as ex:
        print(ex)

#-----------------------------------------------------------------------

# Start the Flask app
if __name__ == '__main__':
    app.run()