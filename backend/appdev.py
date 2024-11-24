from flask import Flask, send_from_directory, jsonify, request, session
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import os
import psycopg2
import secrets
from flask_mail import Mail, Message
import bleach
from datetime import datetime, timedelta
import schedule
import time
import threading
import requests
from bs4 import BeautifulSoup
import pytz

#-----------------------------------------------------------------------

# Initialize the database
load_dotenv()
DATABASE_URL = os.environ.get('DATABASE_URL')
conn = psycopg2.connect(DATABASE_URL)

# Initialize Flask app
app = Flask(__name__, static_folder='build', static_url_path='')

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# Set up secret key
app.secret_key = secrets.token_hex(32)

# set of connected clients
clients = set()

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = os.getenv('EMAIL_USER')
app.config['MAIL_PASSWORD'] = os.getenv('EMAIL_PASS')
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
mail = Mail(app)

# Define relevant URLs
rss_url = os.environ['RSS_URL']

# Set timezone
eastern = pytz.timezone('US/Eastern')

#-----------------------------------------------------------------------

# route to handle a new client connecting
@socketio.on('connect')
def handle_connect():
    clients.add(request.sid)

# route to handle a new client disconnecting
@socketio.on('disconnect')
def handle_connect():
    clients.remove(request.sid)

# Route to serve the React app's index.html
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    # Serve React app for non-API routes
    if path.startswith('api/'):  # Handle invalid API routes
        return "API route not found", 404
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
        print(str(ex))

#-----------------------------------------------------------------------

# Retrieve current user's NetID
@app.route('/get_user')
def get_user():
    if 'username' in session:
        return jsonify({'net_id': session['username']})
    else:
        return jsonify({"success": False, "message": "User not logged in"}), 500

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

# API Route for fetching all active cards
@app.route('/api/cards', methods=['GET'])
def get_data():
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Execute query to retrieve all active cards information
                cursor.execute('''
                    SELECT card_id, title, photo_url, location, location_url, 
                    dietary_tags, allergies, description, posted_at, net_id
                    FROM cards ORDER BY posted_at DESC;
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
                        'location_url': row[4],
                        'dietary_tags': row[5],
                        'allergies': row[6],
                        'description': row[7],
                        'posted_at': row[8],
                        'net_id': row[9]
                    })

                return jsonify(cards)
    except Exception as ex:
        print(str(ex))
        return jsonify({"success": False, "message": str(ex)}), 500
        
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
                    location, location_url, dietary_tags, allergies, description, 
                    posted_at, net_id FROM cards WHERE net_id = %s
                    ORDER BY posted_at DESC;
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
                        'location_url': row[4],
                        'dietary_tags': row[5],
                        'allergies': row[6],
                        'description': row[7],
                        'posted_at': row[8],
                        'net_id': row[9]
                    })

                return jsonify(cards)
    except Exception as ex:
        print(str(ex))
        return jsonify({"success": False, "message": str(ex)}), 500

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

                # Notify connected users that a card has been deleted
                try:
                    for client in clients:
                        socketio.emit("card deleted", "",
                                      room = client)
                except Exception as ex:
                    print(str(ex))
                return jsonify({"success": True, "message": "Action successful!"}), 200
    except Exception as ex:
        print(str(ex))
        return jsonify({"success": False, "message": str(ex)}), 500

#-----------------------------------------------------------------------
        
# API Route for creating cards
@app.route('/api/cards', methods=['POST'])
def create_card():
    try:
        # Retrieve JSON object containing new card data
        card_data = request.get_json()

        # Parse relevant fields
        net_id = card_data.get('net_id')
        title = bleach.clean(card_data.get('title'))
        description = bleach.clean(card_data.get('description'))
        photo_url = bleach.clean(card_data.get('photo_url'))
        location = bleach.clean(card_data.get('location'))
        location_url = card_data.get('location_url')
        dietary_tags = card_data.get('dietary_tags')
        allergies = card_data.get('allergies')

        # Package parsed data
        new_card = [net_id, title, description, photo_url, location, location_url,
                    dietary_tags, allergies]
        
        # Connect to database and establish a cursor
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                
                # Define insertion query
                insertion_query = '''INSERT INTO cards (net_id,
                    title, description, photo_url, location, location_url,
                    dietary_tags, allergies, expiration, posted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s,
                    CURRENT_TIMESTAMP + interval \'3 hours\', 
                    CURRENT_TIMESTAMP)
                '''

                # Execute query to store new card into the database
                cursor.execute(insertion_query, new_card)

                # Commit to the database
                conn.commit()
                
                # Notify connected users that new card has been created
                try:
                    for client in clients:
                        socketio.emit("card created", "", room = client)
                except Exception as ex:
                    print(str(ex))
                return jsonify({"success": True, "message": "Action successful!"}), 200
    except Exception as ex:
        print(str(ex))
        return jsonify({"success": False, "message": str(ex)}), 500

#-----------------------------------------------------------------------

# API Route for editing cards
@app.route('/api/cards/<int:card_id>', methods=['PUT'])
def edit_card(card_id):
    try:
        # Retrieve JSON object
        card_data = request.get_json()

        # Get relevant fields
        title = bleach.clean(card_data.get('title'))
        description = bleach.clean(card_data.get('description'))
        photo_url = bleach.clean(card_data.get('photo_url'))
        location = bleach.clean(card_data.get('location'))
        location_url = bleach.clean(card_data.get('location_url'))
        dietary_tags = card_data.get('dietary_tags')
        allergies = card_data.get('allergies')

        # Packaged parsed data
        new_card = [title, description, photo_url, location, location_url,
                    dietary_tags, allergies, card_id]
        
        # Connect to database
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Define update query
                update_query = 'UPDATE cards SET (title, description, photo_url,'
                update_query += ' location, location_url, dietary_tags, allergies, updated_at)'
                update_query += ' = (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)'
                update_query += ' WHERE card_id = %s'
                # Execute query to update row in the database
                cursor.execute(update_query, new_card)
                # Commit to database
                conn.commit()

                # Notify connected users that a card has been edited
                try:
                    for client in clients:
                        socketio.emit("card edited", "net_id",
                                      room = client)
                except Exception as e:
                    print(str(ex))

                return jsonify({"success": True, "message": "Action successful!"}), 200
    except Exception as ex:
        print(str(ex))
        return jsonify({"success": False, "message": str(ex)}), 500
        
# #-----------------------------------------------------------------------
        
# API Route for retrieving a specific card
@app.route('/api/cards/<int:card_id>', methods=['GET'])
def retrieve_card(card_id):
    try:
        if not card_id:
            return jsonify({"error": "Invalid card_id"}), 400
        
        # Connect to database
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Define insertion query
                retrieval_query = ''' SELECT card_id, title, description,
                    photo_url, location, location_url, dietary_tags, allergies 
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
                        "location_url": row[5],
                        "dietary_tags": row[6],
                        "allergies": row[7]
                    }
                    return jsonify(card)
                else:
                    return jsonify({"error": "Card not found"}), 404

    except Exception as ex:
        print(str(ex))
        return jsonify({"success": False, "message": str(ex)}), 500
            
#-----------------------------------------------------------------------

# API route for sending feedback email to our service account
@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    # Retrieve feedback JSON object from frontend and unpackage it
    feedback_data = request.get_json()
    feedback_sender = feedback_data.get('net_id')
    feedback_text = bleach.clean(feedback_data.get('feedback'))

    # Try to send email
    try:
        msg = Message(
            subject="TigerFoodies Bug",
            sender=app.config['MAIL_USERNAME'],
            recipients=['cs-tigerfoodies@princeton.edu'],
            body=f"Feedback received from {feedback_sender}:\n\n{feedback_text}"
        )
        mail.send(msg)
        return jsonify({"success": True, "message": "Action successful!"}), 200
    except Exception as ex:
        print(ex)
        return jsonify({"success": False, "message": "Action unsuccessful"}), 500

#-----------------------------------------------------------------------

# API Route for retrieving a specific card's comments
@app.route('/api/comments/<int:card_id>', methods=['GET'])
def retrieve_card_comments(card_id):
    try:
        # Connect to database
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Define insertion query
                retrieval_query = ''' SELECT net_id, comment, posted_at 
                FROM comments WHERE card_id = %s ORDER BY posted_at DESC;'''
                # Execute query to retrieve card with given card_id
                cursor.execute(retrieval_query, [card_id])
                rows = cursor.fetchall()

                # Package queried data and send it over
                if rows:
                    comments = []
                    for row in rows:
                        comments.append({
                            'net_id': row[0],
                            'comment': row[1],
                            'posted_at': row[2],
                        })
                    return jsonify(comments)
                else:
                    return jsonify({"error": "Card not found"}), 404

    except Exception as ex:
        print(str(ex))
        return jsonify({"success": False, "message": str(ex)}), 500
    
#-----------------------------------------------------------------------

# API Route for creating comments
@app.route('/api/comments/<int:card_id>', methods=['POST'])
def create_card_comment(card_id):
    try:
        # Retrieve JSON object containing new card data
        new_comment_data = request.get_json()
        # testing message if comment wasn't recognized / put in 
        if not new_comment_data or 'comment' not in new_comment_data:
            return jsonify({"success": False, "message": "Missing comment data"}), 400

        # Parse relevant fields
        net_id = new_comment_data.get('net_id')
        comment = bleach.clean(new_comment_data.get('comment'))

        # Package parsed data
        new_comment = [net_id, comment, card_id]
       
        # Connect to database and establish a cursor
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
               
                 # test for me to verify the card exists
                cursor.execute("SELECT 1 FROM cards WHERE card_id = %s", (card_id,))
                if not cursor.fetchone():
                    return jsonify({"success": False, "message": "Card not found"}), 404
                
                # Define insertion query
                insertion_query = '''INSERT INTO comments (net_id,
                    comment, card_id, posted_at)
                    VALUES (%s, %s, %s,
                    CURRENT_TIMESTAMP)
                '''

                # Execute query to store new card into the database
                cursor.execute(insertion_query, new_comment)
                
                # Commit to the database
                conn.commit()

                # Notify connected users that a comment has been created
                try:
                    for client in clients:
                        socketio.emit("comment created", card_id,
                                      room = client)
                except Exception as e:
                    print(str(ex))
                return jsonify({"success": True, "message": "Action successful!"}), 200
    except Exception as ex:
        print(str(ex))
        return jsonify({"success": False, "message": str(ex)}), 500

#-----------------------------------------------------------------------

# Scrape listserv RSS script and add new cards to our database
def fetch_recent_rss_entries():
    try:
        # Connect to database and establish a cursor
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Start a session to carry over credential cookies
                session = requests.Session()
                
                # Log into the listserv site
                login_page = session.get(rss_url)
                soup_login = BeautifulSoup(login_page.text, "lxml")
                hidden_inputs = soup_login.find_all("input", type="hidden")
                payload = {input_tag["name"]: input_tag.get("value", "") 
                           for input_tag in hidden_inputs}
                payload["Y"] = os.environ["LISTSERV_USERNAME"]
                payload["p"] = os.environ["PASS"]
                session.post(rss_url, data=payload)

                # Define time threshold to retrieve most recent entries
                time_threshold = datetime.now(eastern) - timedelta(seconds=60)

                # Retrieve entries from freefood listserv RSS script
                rss_response = session.get(rss_url)
                soup_scrape = BeautifulSoup(rss_response.content, "xml")
                items = soup_scrape.find_all("item")

                # Loop to add new entries from scraper to database
                for item in items:
                    # If scraper finds old entry, break from loop, no
                    # more new entries to add
                    pubDate = datetime.strptime(
                        item.pubDate.text, "%a, %d %b %Y %H:%M:%S %z")
                    if pubDate < time_threshold:
                        break
                    
                    # Scrape relevant information from entry
                    title = item.title.text

                    # Package data to be inserted into database
                    data = ["cs-tigerfoodies", title]

                    # Create insertion query
                    insertion_query = """INSERT INTO cards (net_id,
                        title, expiration, posted_at)
                        VALUES (%s, %s, 
                        CURRENT_TIMESTAMP + interval \'3 hours\', 
                        CURRENT_TIMESTAMP)
                    """

                    #Execute insertion query
                    cursor.execute(insertion_query, data)
                    conn.commit()
    except Exception as ex:
        print(str(ex))

#-----------------------------------------------------------------------

# Run scheduled tasks
schedule.every(60).seconds.do(clean_expired_cards)
schedule.every(60).seconds.do(fetch_recent_rss_entries)

# Make sure the scheduler is always active
def run_scheduler():
    while(True):
        schedule.run_pending()
        time.sleep(1)

# Run the scheduler thread
scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
scheduler_thread.start()

#-----------------------------------------------------------------------

# Start the Flask app
if __name__ == '__main__':
    socketio.run(app)