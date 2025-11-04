import os
import logging
import threading
import json
import twitchio
import asyncio
from datetime import datetime
from flask import Flask, render_template, jsonify, session, request
from flask_socketio import SocketIO, emit
from twitchio import *
from twitchio.ext import commands

app = Flask(__name__)

socketio = SocketIO
socketio = SocketIO(app, async_mode="threading")
print(socketio.async_mode)

# Set up logging
logger = logging.getLogger('fs_app')

# Read relevant environment variables
TWITCH_CLIENT_ID = os.getenv('TWITCH_CLIENT_ID')
TWITCH_ACCESS_TOKEN = os.getenv('TWITCH_ACCESS_TOKEN')
TWITCH_CHANNEL_NAME = os.getenv('TWITCH_CHANNEL_NAME')
TWITCH_CLIENT_SECRET = os.getenv('TWITCH_CLIENT_SECRET')

# Set local copies for testing
TWITCH_CLIENT_ID = ""
TWITCH_CLIENT_SECRET = ""
TWITCH_ACCESS_TOKEN = ""
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
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    if not logger.handlers:
        logger.addHandler(handler)

    logger.info(f"TWITCH_CLIENT_ID=%s", TWITCH_CLIENT_ID)
    # Do not print the full access token; show whether it's present
    logger.info("TWITCH_ACCESS_TOKEN present=%s", bool(TWITCH_ACCESS_TOKEN))
    logger.info("TWITCH_CLIENT_SECRET present=%s", bool(TWITCH_CLIENT_SECRET))
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
            nick="Porygon_Bot_",
            prefix='?',
            initial_channels=['#'+TWITCH_CHANNEL_NAME],
            client_id=TWITCH_CLIENT_ID,
            client_secret=TWITCH_CLIENT_SECRET,
            bot_id="1388303571",
        )

    # async def event_ready(self):
    #     logger.info(f"Twitch bot connected as {self.nick}")

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

        if "test" in content:
            # 2. Define the response message
            response = f"@{username}, thanks for testing! I received your message."
            
            # 3. Send the message back to the channel
            # message.channel is an object representing the channel where the message came from
            await message.channel.send(response)

        # Here you could detect special messages or trigger server-side logic
        logger.info('Chat from %s: %s', username, content)

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
        logger.info('Redemption by %s: %s', username, reward_title)

class GeneralCommands(commands.Component):
    @commands.command()
    async def hi(self, ctx: commands.Context[TwitchBot]) -> None:
        """Command that replies to the invoker with Hi <name>!

        !hi
        """
        await ctx.reply(f"Hi {ctx.chatter}!")

    @commands.command()
    async def say(self, ctx: commands.Context[TwitchBot], *, message: str) -> None:
        """Command which repeats what the invoker sends.

        !say <message>
        """
        await ctx.send(message)

    @commands.command()
    async def add(self, ctx: commands.Context[TwitchBot], left: int, right: int) -> None:
        """Command which adds to integers together.

        !add <number> <number>
        """
        await ctx.reply(f"{left} + {right} = {left + right}")

    @commands.command()
    async def choice(self, ctx: commands.Context[TwitchBot], *choices: str) -> None:
        """Command which takes in an arbitrary amount of choices and randomly chooses one.

        !choice <choice_1> <choice_2> <choice_3> ...
        """
        await ctx.reply(f"You provided {len(choices)} choices, I choose: {random.choice(choices)}")

    @commands.command(aliases=["thanks", "thank"])
    async def give(self, ctx: commands.Context[TwitchBot], user: twitchio.User, amount: int, *, message: str | None = None) -> None:
        """A more advanced example of a command which has makes use of the powerful argument parsing, argument converters and
        aliases.

        The first argument will be attempted to be converted to a User.
        The second argument will be converted to an integer if possible.
        The third argument is optional and will consume the reast of the message.

        !give <@user|user_name> <number> [message]
        !thank <@user|user_name> <number> [message]
        !thanks <@user|user_name> <number> [message]
        """
        msg = f"with message: {message}" if message else ""
        await ctx.send(f"{ctx.chatter.mention} gave {amount} thanks to {user.mention} {msg}")



if __name__ == '__main__':
    _log_env_values()
    # Start Twitch bot in background thread (if configured)
    if TWITCH_ACCESS_TOKEN and TWITCH_CHANNEL_NAME:
        
        twitchio.utils.setup_logging(level=logging.INFO)
        
        def _start_bot():
            try:
                bot = TwitchBot()
                bot.run()
            except Exception as e:
                logger.exception('Failed to start Twitch bot: %s', e)

        t = threading.Thread(target=_start_bot)
        t.start()

    # app.run(debug=False)
    socketio.run(app)