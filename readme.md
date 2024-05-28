# Discord Avatar Decoration Bot

This is a Discord bot that allows users to decorate their avatars with unique visual effects. The bot is built using [discord.js](https://discord.js.org/), [canvas](https://github.com/Automattic/node-canvas), and [gif-encoder-2](https://www.npmjs.com/package/gif-encoder-2). The effects are provided in the `effects.json` file, and users can select them via a slash command to apply to their avatars.

## Features

- Select from a variety of visual effects to decorate your avatar.
- The bot generates a GIF with the chosen effect and sends it back to the user.
- Handles different categories of effects with emoji representation.
- Designed to be extensible and easy to configure.

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- A Discord bot token. You can get one by creating a bot on the [Discord Developer Portal](https://discord.com/developers/applications).

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/wickstudio/discord-avatar-decoration-bot.git
   cd discord-avatar-decoration-bot
   ```

2. Install the dependencies:

   ```sh
   npm install
   ```

3. Configure the bot by creating a `config.js` file in the root directory and adding your Discord bot token and guild ID:

   ```js
   module.exports = {
     guildId: "YOUR_GUILD_ID",
     token: "YOUR_BOT_TOKEN"
   };
   ```

4. Create a `effects.json` file in the root directory to define the available effects. Here is an example:

   ```json
   [
     {
       "id": "1232071069268049920",
       "url": "https://cdn.discordapp.com/avatar-decoration-presets/a_a47890109a231f72dae7b17b27164676.png?size=240&passthrough=true",
       "label": "A glittering ring of colorful stardust adorns the avatar with a celestial touch.",
       "category": "decorations",
       "emoji": "<emoji_1232071069268049920:1238864757491109889>"
     },
     ...
   ]
   ```

## Running the Bot

Start the bot with the following command:

```sh
node index.js
```

## Usage

- Invite the bot to your Discord server.
- Use the `/effect` command to bring up the menu of available effects.
- Select an effect from the dropdown menu to apply it to your avatar.
- The bot will generate a GIF with the chosen effect and send it back to you.

## Contributing

If you would like to contribute to this project, please feel free to submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---
## Contact

- Email: wick@wick-studio.com
- Website: https://wickdev.xyz
- Discord: https://discord.gg/wicks
- YouTube: https://www.youtube.com/@wick_studio