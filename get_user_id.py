import os
import asyncio
import twitchio

CLIENT_ID: str = os.getenv('TWITCH_CLIENT_ID')  # The CLIENT ID from the Twitch Dev Console
CLIENT_SECRET: str = os.getenv('TWITCH_CLIENT_SECRET')  # The CLIENT SECRET from the Twitch Dev Console

async def main() -> None:
    async with twitchio.Client(client_id=CLIENT_ID, client_secret=CLIENT_SECRET) as client:
        await client.login()
        user = await client.fetch_users(logins=["itsmejoji", "porygon_bot_"])
        for u in user:
            print(f"User: {u.name} - ID: {u.id}")

if __name__ == "__main__":
    asyncio.run(main())