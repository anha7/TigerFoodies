import feedparser
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

def fetch_recent_rss_entries():
    # Define RSS feed URL
    rss_url = os.envron['RSS_URL']

    # Define time threshold to retrieve most recent entries
    time_threshold = datetime.now() - timedelta(hours=3)