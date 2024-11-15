from flask import Flask, send_from_directory, jsonify, request, session, redirect, url_for
from dotenv import load_dotenv
import os
import psycopg2
import secrets
from flask_mail import Mail, Message
import bleach
import requests
import time

#-----------------------------------------------------------------------

# Initialize the database
load_dotenv()
DATABASE_URL = os.environ.get('DATABASE_URL')
conn = psycopg2.connect(DATABASE_URL)

# Initialize Flask app
app = Flask(__name__, static_folder='build', static_url_path='')

# Set up secret key
app.secret_key = secrets.token_hex(32)

# Email configuration
# app.config['MAIL_SERVER'] = 'smtp.gmail.com'
# app.config['MAIL_PORT'] = 465
# app.config['MAIL_USERNAME'] = os.getenv('EMAIL_USER')
# app.config['MAIL_PASSWORD'] = os.getenv('EMAIL_PASS')
# app.config['MAIL_USE_TLS'] = False
# app.config['MAIL_USE_SSL'] = True
# mail = Mail(app)

# Load Azure credentials
client_id = os.getenv('AZURE_CLIENT_ID')
client_secret = os.getenv('AZURE_CLIENT_SECRET')
tenant_id = os.getenv('AZURE_TENANT_ID')
redirect_email = 'cs-tigerfoodies@princeton.edu'
redirect_uri = 'http://localhost:5000/callback'
authorization_url = f'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize'
scope = 'Mail.Read User.Read offline_access'

# OAuth 2.0 token URL for Microsoft
token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
graph_api_url = "https://graph.microsoft.com/v1.0"

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

@app.route('/initiate')
def initiate():
    # Redirect user to Microsoft's authorization endpoint
    return redirect(f"{authorization_url}?client_id={client_id}&response_type=code&redirect_uri={redirect_uri}&scope={scope}")

@app.route('/callback')
def callback():
    code = request.args.get('code')
    if not code:
        return jsonify({"error": "Authorization code not provided"}), 400

    # Request tokens from Microsoft
    token_response = requests.post(token_url, data={
        'client_id': client_id,
        'client_secret': client_secret,
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': redirect_uri
    })

    if token_response.status_code != 200:
        print(f"Failed to retrieve tokens: {token_response.json()}")
        return jsonify({"error": "Failed to retrieve tokens", "details": token_response.json()}), 400

    token_data = token_response.json()
    refresh_token = token_data.get('refresh_token')
    access_token = token_data.get('access_token')
    token_expiry = int(time.time()) + token_data.get('expires_in', 0)

    if not refresh_token or not access_token:
        print("Missing tokens in response.")
        return jsonify({"error": "Missing tokens in response"}), 400

    # Save tokens in the database
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                cursor.execute('''
                    INSERT INTO tokens (refresh_token, access_token, token_expiry)
                    VALUES (%s, %s, %s)
                    ON CONFLICT DO NOTHING;
                ''', (refresh_token, access_token, token_expiry))
                conn.commit()

    except Exception as e:
        print(f"Error saving tokens: {e}")
        return jsonify({"error": "Failed to save tokens"}), 500

    print(f"Saved Refresh Token: {refresh_token}")
    print(f"Saved Access Token: {access_token}")
    print(f"Token Expiry: {token_expiry}")
    return 'Authorization successful! Tokens have been saved.'

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
        dietary_tags = card_data.get('dietary_tags')
        allergies = card_data.get('allergies')

        # Package parsed data
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
        dietary_tags = card_data.get('dietary_tags')
        allergies = card_data.get('allergies')

        # Packaged parsed data
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
                return jsonify({"success": True, "message": "Action successful!"}), 200
    except Exception as ex:
        print(str(ex))
        return jsonify({"success": False, "message": str(ex)}), 500
        
# #-----------------------------------------------------------------------
        
# API Route for retrieving a specific card
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
        print(str(ex))
        return jsonify({"success": False, "message": str(ex)}), 500
            
#-----------------------------------------------------------------------

# Helper function to get access token
def get_access_token():
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                cursor.execute('SELECT refresh_token, access_token, token_expiry FROM tokens ORDER BY id DESC LIMIT 1;')
                result = cursor.fetchone()
                if not result:
                    print("No tokens found in the database.")
                    return None

                refresh_token, access_token, token_expiry = result

                print("Retrieved Refresh Token:", refresh_token)
                print("Retrieved Access Token:", access_token)
                print("Token Expiry Time:", token_expiry)

                # Check if access token is still valid
                if access_token and token_expiry > int(time.time()):
                    print("Using cached access token.")
                    return access_token

                # If refresh token exists, attempt to refresh
                if refresh_token:
                    data = {
                        'client_id': client_id,
                        'refresh_token': refresh_token,
                        'client_secret': client_secret,
                        'grant_type': 'refresh_token',
                        'scope': 'Mail.Read Mail.Send User.Read offline_access'
                    }
                    response = requests.post(token_url, data=data)
                    if response.status_code != 200:
                        print(f"Error refreshing token: {response.text}")
                        return None

                    token_data = response.json()
                    new_access_token = token_data.get('access_token')
                    new_refresh_token = token_data.get('refresh_token', refresh_token)
                    new_token_expiry = int(time.time()) + token_data.get('expires_in', 3600)

                    # Save new tokens in the database
                    cursor.execute('''
                        UPDATE tokens
                        SET refresh_token = %s, access_token = %s, token_expiry = %s
                        WHERE id = (SELECT MAX(id) FROM tokens);
                    ''', (new_refresh_token, new_access_token, new_token_expiry))
                    conn.commit()

                    print("New Access Token:", new_access_token)
                    print("New Refresh Token:", new_refresh_token)
                    print("New Token Expiry:", new_token_expiry)

                    return new_access_token

                print("No valid refresh token available.")
                return None
    except Exception as e:
        print(f"Error retrieving tokens: {e}")
        return None

#-----------------------------------------------------------------------

# Helper function to send email via Microsoft Graph
def send_feedback_email(subject, body):
    access_token = get_access_token()
    if not access_token:
        return False  # Unable to retrieve a valid token

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    email_data = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "Text",
                "content": body
            },
            "toRecipients": [
                {
                    "emailAddress": {
                        "address": redirect_email
                    }
                }
            ]
        }
    }
    send_mail_url = f"{graph_api_url}/me/sendMail"
    response = requests.post(send_mail_url, headers=headers, json=email_data)

    try:
        response.raise_for_status()
        return True
    except requests.exceptions.HTTPError as err:
        print(f"Error sending email: {err}")
        print(f"Response: {response.text}")
        return False

#-----------------------------------------------------------------------

# API route for sending feedback email to our service account
@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    # Retrieve feedback JSON object from frontend and unpackage it
    feedback_data = request.get_json()
    feedback_sender = feedback_data.get('net_id')
    feedback_text = bleach.clean(feedback_data.get('feedback'))

    # Prepare email content
    subject = "TigerFoodies Bug"
    body = f"Feedback received from {feedback_sender}:\n\n{feedback_text}"

    # Try to send email
    try:
        if send_feedback_email(subject, body):
            return jsonify({"success": True, "message": "Action successful!"}), 200
        else:
            return jsonify({"success": False, "message": "Failed to send message"}), 500
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
                FROM comments WHERE card_id = %s;'''
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
                return jsonify({"success": True, "message": "Action successful!"}), 200
    except Exception as ex:
        print(str(ex))
        return jsonify({"success": False, "message": str(ex)}), 500


#-----------------------------------------------------------------------

# Start the Flask app
if __name__ == '__main__':
    app.run()
