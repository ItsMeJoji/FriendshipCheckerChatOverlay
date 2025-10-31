import os
import logging
import threading
import json
import twitchio
import asyncio
from datetime import datetime
from flask import Flask, render_template, jsonify
from twitchio import eventsub
from twitchio.ext import commands

app = Flask(__name__)

# Read relevant environment variables
TWITCH_CLIENT_ID = os.getenv('TWITCH_CLIENT_ID')
TWITCH_ACCESS_TOKEN = os.getenv('TWITCH_ACCESS_TOKEN')
TWITCH_CHANNEL_NAME = os.getenv('TWITCH_CHANNEL_NAME')

# In-memory store for chat events and redemptions per username
active_chatters = {}


def _ensure_user_record(username: str):
    """Ensure a record exists for a chatter."""
    if username not in active_chatters:
        active_chatters[username] = {
            "messages": [],
            "redemptions": [],
            "lastSeen": None
        }
    return active_chatters[username]


@app.route('/')
def index():
    return render_template('index.html', title='Friendship Checker')


def _log_env_values():
    """Log environment values to the console at startup.

    We avoid printing full secrets; instead we log presence of sensitive values.
    """
    logger = logging.getLogger('fs_app')
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    if not logger.handlers:
        logger.addHandler(handler)

    logger.info(f"TWITCH_CLIENT_ID=%s", TWITCH_CLIENT_ID)
    # Do not print the full access token; show whether it's present
    logger.info("TWITCH_ACCESS_TOKEN present=%s", bool(TWITCH_ACCESS_TOKEN))
    logger.info(f"TWITCH_CHANNEL_NAME=%s", TWITCH_CHANNEL_NAME)


# Note: startup code that launches the Twitch bot is placed after the
# TwitchBot class definition so the class is defined before it's referenced.


# Simple API to inspect active chatters (for debugging)
@app.route('/api/active_chatters', methods=['GET'])
def get_active_chatters():
    # Return a JSON-serializable snapshot
    return jsonify(active_chatters)


class TwitchBot(commands.Bot):
    """Twitch chat bot that records messages and (placeholder) redemptions.

    This bot connects to Twitch IRC and listens for chat messages. Channel point
    redemptions typically require PubSub/EventSub; handling for those can be
    added later. For now we capture chat messages and expose a place to store
    redemption events as they arrive.
    """
    def __init__(self):
        super().__init__(
            token=TWITCH_ACCESS_TOKEN,
            client_id=TWITCH_CLIENT_ID,
            nick=TWITCH_CHANNEL_NAME,
            prefix='?',
            initial_channels=[TWITCH_CHANNEL_NAME]
        )

    async def event_ready(self):
        logging.getLogger('fs_app').info(f"Twitch bot connected as {self.nick}")

    async def event_message(self, message):
        # Ignore messages from the bot itself
        if message.echo:
            return

        username = message.author.name
        content = message.content

        # Ensure record
        rec = _ensure_user_record(username)
        rec['messages'].append({
            'content': content,
            'timestamp': datetime.utcnow().isoformat()
        })
        rec['lastSeen'] = datetime.utcnow().isoformat()

        # Here you could detect special messages or trigger server-side logic
        logging.getLogger('fs_app').info('Chat from %s: %s', username, content)

        # Process commands if any
        await self.handle_commands(message)

    # Placeholder for redemption handling: if you implement PubSub/EventSub,
    # call this method to record redemptions
    def record_redemption(self, username: str, reward_title: str, user_input: str = None):
        rec = _ensure_user_record(username)
        rec['redemptions'].append({
            'reward': reward_title,
            'input': user_input,
            'timestamp': datetime.utcnow().isoformat()
        })
        rec['lastSeen'] = datetime.utcnow().isoformat()
        logging.getLogger('fs_app').info('Redemption by %s: %s', username, reward_title)


if __name__ == '__main__':
    _log_env_values()
    # Start Twitch bot in background thread (if configured)
    if TWITCH_ACCESS_TOKEN and TWITCH_CHANNEL_NAME:
        def _start_bot():
            try:
                bot = TwitchBot()
                bot.run()
            except Exception as e:
                logging.getLogger('fs_app').exception('Failed to start Twitch bot: %s', e)

        t = threading.Thread(target=_start_bot, daemon=True)
        t.start()

    app.run(debug=True)