# Friendship Checker - Chat Overlay

This will simulate the Friendship checker from Gen 4 Pokemon games as an overlay, using chat members as Random Pokemon.

## Quickstart (recommended — local development / OBS)

1. Install Requiremente:

```powershell
pip install -r requirements.txt
```

2. Set up environment variables:

Create a `.env` file in the project root with the following variables:
```
TWITCH_ACCESS_TOKEN=your_access_token
TWITCH_CLIENT_ID=your_client_id
TWITCH_CHANNEL_NAME=your_channel_name
```

You can generate your Twitch access token at https://twitchtokengenerator.com/ . The token needs to have at least chat:read, chat:edit, moderator:read:chatters, channel:read:redemptions permissions. to work correcctly.

3. Start the server (from the project root):

```powershell
python app.py
```

4. Open the overlay in your browser or add it to OBS as a Browser

