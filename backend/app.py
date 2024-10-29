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
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor as cursor:
            
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
        
#-----------------------------------------------------------------------

# API Route for creating cards
@app.route('/api/food-cards', methods=['POST'])
def create_card():
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor as cursor:
            # fill in with obj later
            o = objdct code
            # Execute query to retrieve all active cards' information
            cursor.execute(
                'INSERT INTO cards (card_id, net_id, title, description, photo_url, location, dietery_tags, allergies, expiration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP + interval \'3 hours\')'
            , [o])
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

#-----------------------------------------------------------------------

# Start the Flask app
if __name__ == '__main__':
    app.run()
