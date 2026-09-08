# PorygonBot - Twitch Chat Bot

PorygonBot is a Twitch chat bot with a few automated responses and some simple chat commands.

## Features

- **Automated Greetings**: Greets chatters when they say hello or something similar.
- **Lag Monitoring**: Watches for "lag" mentions and alerts the streamer.
- **Porygon Mentions**: Replies to mentions of "Porygon".
- **Message Garbling**: Occasionally scrambles a message for fun.
- **Periodic Chat Messages**: Sends timed promotional messages from a JSON config file.
- **Mini-games**: Includes a `!shinyroll` command to test your luck against standard shiny odds (1 in 8192).
- **Stream tools**: Creates Twitch clips and stream markers with `!clip`.
- **Stream Docket Integration**: Manages and updates Twitch stream categories from a live Google Sheet docket with `!update` and `!nextitem`, and provides docket access with `!docket`.

## Commands

- `!porygonbot`: Prints a short bot intro.
- `!commands`: Displays a link to the complete command list on `commands.html` (aliases: `!cmds`).
- `!lurk`: Acknowledges that you are lurking.
- `!socials`: Shows the streamer's social links.
- `!discord`: Shows the Discord invite link.
- `!docket`: Shows the current stream docket link.
- `!shinyroll`: Rolls a number from 1 to 8192.
- `!clip [description]`: Creates a clip from the live stream and adds a stream marker. Available to chat with a short global cooldown.
- `!bingo`: Shows the current bingo link.
- `!join`: (Owner only) Makes the bot send `!join` in chat.
- `!update <position>`: (Owner only) Updates the stream category from a specified row in the stream docket CSV (aliases: `!updatecategory`, `!scanitem`, `!docketscan`).
- `!nextitem`: (Owner only) Advances to the next stream docket row and updates the stream category (aliases: `!nextdocket`, `!nextscan`).
- `!setbingo <link>`: (Owner only) Update the bingo link.
- `!reloadpromos`: (Owner only) Reload the periodic message config file without restarting.

## Setup

### Prerequisites

- Python 3.8+
- [Twitch Developer Account](https://dev.twitch.tv/) to get Client ID and Client Secret.

### Installation

1. Clone the repository and navigate to the project directory.
2. Install the required dependencies:

```powershell
pip install -r requirements.txt
```

### Configuration

Create a `.env` file in the project root with your Twitch credentials:

```env
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
```

*Note: `BOT_ID` and `OWNER_ID` are set in `porygon.py`.*

### Periodic Messages

The bot reads periodic chat messages from [`promo_messages.json`](./promo_messages.json).

A typical entry looks like this:

```json
{
  "name": "commands",
  "min_interval_minutes": 30,
  "max_interval_minutes": 60,
  "messages": [
    "NOTICE: View all available commands here: https://itsmejoji.github.io/StreamAssets/commands.html"
  ],
  "randomize": false
}
```

- `min_interval_minutes` and `max_interval_minutes` specify a random time range between messages (or `interval_minutes` for a fixed interval).
- `messages` can be a single message or a list of messages.
- `randomize` picks a random message from the list when `true`.

After editing the file, restart the bot or use `!reloadpromos` to reload it without restarting.

### Running the Bot

Run the bot with:

```powershell
python porygon.py
```

The bot stores tokens in a local `tokens.db` file.

For `!clip`, the broadcaster must authorize the bot with `clips:edit` and `channel:manage:broadcast`. Existing broadcaster tokens created before this command was added need to be reauthorized so Twitch grants the new `clips:edit` scope.
