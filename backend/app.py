from flask import Flask, send_from_directory, jsonify
import os
import psycopg2

#-----------------------------------------------------------------------
# Initialize the database
DATABASE_URL = os.environ.get('DATABASE_URL')
conn = psycopg2.connect(DATABASE_URL)

# Initialize Flask app
app = Flask(__name__, static_folder='build', static_url_path='')

#-----------------------------------------------------------------------

# Route to serve the React app's index.html
@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

# Route to serve static files (like CSS, JS, images, etc.)
@app.route('/static/<path:path>')
def serve_static_files(path):
    return send_from_directory(app.static_folder + '/static', path)

#-----------------------------------------------------------------------

# API Route for fetching cards for the homepage
@app.route('/api/cards', methods=['GET'])
def get_data():
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                
                # Execute query to retrieve all active cards' information
                cursor.execute('''
                    'SELECT card_id, title, photo_url, location, 
                    dietary_tags, allergies, posted_at
                    FROM cards;'
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
                        'posted_at': row[6]
                    })

                cards = []
                return jsonify(cards)
    except Exception as ex:
        print(ex)
        
#-----------------------------------------------------------------------
        

# API Route for retrieving cards from user
@app.route('/api/cards/<int:user_id>', methods=['GET'])
def retrieve_user_cards(user_id):
    try:

        # check new card attributes (Should we?)
        if not user_id:
            return jsonify("error: Missing required fields")
        
        # connect to database
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # define insertion query
                insertion_query = '''SELECT card_id, title, photo_url, location, 
                    dietary_tags, allergies, posted_at FROM cards'''
                insertion_query += ' WHERE user_id = %s;'
                # Execute query to retrieve user's cards
                cursor.execute(insertion_query, [user_id])
                row = cursor.fetchall()
                return jsonify(row)

    except Exception as ex:
        print(ex)

#-----------------------------------------------------------------------
        

# API Route for deleting cards
# is the first arg of route wrong?
@app.route('/api/cards<int:card_id>', methods=['DELETE'])
def delete_card(card_id):
    try:
        # connect to database
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # define deletion query
                deletion_query = 'DELETE FROM cards WHERE card_id = %s;'
                # Execute query to delete card with given card_id
                cursor.execute(deletion_query, [card_id])
                # Commit to database
                conn.commit()

    except Exception as ex:
        print(ex)

#-----------------------------------------------------------------------

        
# API Route for creating cards
@app.route('/api/cards', methods=['POST'])
def create_card():
    try:
        # retrieve json object
        card_data = app.request.get_json()
        # get relevant fields
        card_id = card_data.get('card_id')
        net_id = card_data.get('net_id')
        title = card_data.get('title')
        description = card_data.get('description')
        photo_url = card_data.get('photo_url')
        location = card_data.get('location')
        dietary_tags = card_data.get('dietary_tags')
        allergies = card_data.get('allergies')
        new_card = [card_id, net_id, title, description, photo_url, location, dietary_tags, allergies]

        # check new card attributes (Should we?)
        if not all([card_id, net_id, title, location]):
            return jsonify("error: Missing required fields")
        
        # connect to database
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # define insertion query
                insertion_query = 'INSERT INTO cards (card_id, net_id, title, description, photo_url'
                insertion_query += ', location, dietery_tags, allergies, expiration, posted_at) VALUES'
                insertion_query += ' (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP + interval \'3 hours\', CURRENT_TIMESTAMP)'
                # Execute query to create this new card 
                cursor.execute(insertion_query, new_card)
                # Commit to database
                conn.commit()

    except Exception as ex:
        print(ex)

#-----------------------------------------------------------------------


# API Route for editing cards
@app.route('/api/cards/id', methods=['PUT'])
def edit_card():
    try:
        # retrieve json object
        card_data = app.request.get_json()
        # get relevant fields
        card_id = card_data.get('card_id')
        title = card_data.get('title')
        description = card_data.get('description')
        photo_url = card_data.get('photo_url')
        location = card_data.get('location')
        dietary_tags = card_data.get('dietary_tags')
        allergies = card_data.get('allergies')
        new_card = [title, description, photo_url, location, dietary_tags, allergies, card_id]

        # check new card attributes (Should we?)
        if not all([card_id, title, location]):
            return jsonify("error: Missing required fields")
        
        # connect to database
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # define update query
                update_query = 'UPDATE cards SET (title, description, photo_url'
                update_query += ', location, dietery_tags, allergies, updated_at)'
                update_query += ' = (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)'
                update_query += ' WHERE card_id = %s'
                # Execute query to update row in the database
                cursor.execute(update_query, new_card)
                # Commit to database
                conn.commit()

    except Exception as ex:
        print(ex)

#-----------------------------------------------------------------------
        
# API Route for retrieving cards
@app.route('/api/cards/<int:card_id>', methods=['GET'])
def retrieve_card(card_id):
    try:
        # connect to database
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # define insertion query
                retrieval_query = ''' SELECT card_id, title, photo_url, location, 
                    dietary_tags, allergies, posted_at FROM cards '''
                retrieval_query += ' WHERE card_id = %s;'
                # Execute query to retrieve card with given card_id
                cursor.execute(retrieval_query, [card_id])
                row = cursor.fetchall()
                return jsonify(row)

    except Exception as ex:
        print(ex)

#-----------------------------------------------------------------------
# Start the Flask app
if __name__ == '__main__':
    app.run()
