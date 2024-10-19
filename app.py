from flask import Flask
import os
import psycopg2

DATABASE_URL = os.environ.get('DATABASE_URL')
conn = psycopg2.connect(DATABASE_URL)

app = Flask(__name__)

@app.route('/')
def index():
    return 'Hello, TigerFoodies!'

if __name__ == '__main__':
    app.run()
