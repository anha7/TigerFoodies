from flask import Flask, send_from_directory
import os
import psycopg2

# Initialize the database
DATABASE_URL = os.environ.get('DATABASE_URL')
conn = psycopg2.connect(DATABASE_URL)

# Initialize Flask app
app = Flask(__name__, static_folder='build', static_url_path='')

# Route to serve the React app's index.html
@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

# Route to serve static files (like CSS, JS, images, etc.)
@app.route('/static/<path:path>')
def serve_static_files(path):
    return send_from_directory(app.static_folder + '/static', path)

# Example API route
@app.route('/api/data')
def get_data():
    return {"message": "Hello from the Flask backend!"}

# Start the Flask app
if __name__ == '__main__':
    app.run()
