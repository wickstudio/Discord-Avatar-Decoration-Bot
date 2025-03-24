# Discord Avatar Decoration Bot

A powerful Discord bot that allows users to add decorative effects to their profile pictures. Users can choose from a variety of decorations including Discord's official avatar decorations and country flags.

![Bot Showcase](https://i.imgur.com/4m0b8w3.png)

## ✨ Features

- **Avatar Decorations**: Apply animated decorative effects to user avatars
- **Extensive Collection**: Support for Discord's official avatar decorations and country flags
- **Channel Restrictions**: Configure specific channels where the bot can be used
- **User-Friendly Interface**: Clean UI with categorized effects and navigation buttons
- **Random Effects**: Get a random decoration with one click
- **Slash Commands**: Full support for Discord's slash commands system
- **Legacy Commands**: Also supports traditional prefix commands (`!effect`)
- **Cooldown System**: Prevents abuse and rate limiting
- **Robust Error Handling**: Comprehensive error logging and recovery
- **High-Quality Output**: Generates high-resolution avatar GIFs

## 📋 Requirements

- Node.js 16.9.0 or higher
- A Discord Bot Token
- Discord.js v14

## 🚀 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/wickstudio/discord-avatar-decoration-bot.git
   cd discord-avatar-decoration-bot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure the bot** in `config.js`:
   ```javascript
   module.exports = {
  token: "TOKEN", // Your bot token
  guildId: "ID", // Your server ID (for guild commands)
  
  // COMMAND SETTINGS
  defaultPrefix: "!", // Prefix for commands
  cooldown: 5, // Command cooldown in seconds
  
  allowedChannelIds: ["ID"], // Channel IDs
  
  avatarSize: 512, // Avatar size
  gifQuality: 10, // GIF quality (1-30)
  frameDelay: 100, // Delay between frames in ms
};
   ```

4. **Start the bot**:
   ```bash
   npm start
   ```

## 💻 Usage

### Commands

- `/effect` - Opens the avatar decoration menu (slash command)
- `/help` - Shows bot help and information
- `/ping` - Checks bot response time and connection status
- `!effect` - Text command to open the avatar decoration menu

### How to Use

1. Type `/effect` or `!effect` in any allowed channel
2. Select a decoration category from the dropdown menus
3. Click on the desired effect
4. The bot will reply with your decorated avatar as a GIF

### Channel Restrictions

You can restrict the bot to only work in specific channels:

- **Allow in specific channels**: Add channel IDs to the `allowedChannelIds` array
- **Disable completely**: Set `allowedChannelIds` to an empty array `[]`
- **Allow everywhere**: Set `allowedChannelIds` to `null` or remove the setting

## 🛠️ Development

- **Run with auto-restart**:
  ```bash
  npm run dev
  ```

- **Check for linting issues**:
  ```bash
  npm run lint
  ```

## 🔧 Advanced Configuration

The bot allows for detailed customization:

- **Button Customization**: Navigation buttons support custom emojis
- **GIF Quality**: Adjustable avatar size and GIF quality settings
- **Cooldown Management**: Configurable cooldown settings to prevent spam

## ⚠️ Troubleshooting

If you encounter issues:

- Ensure your bot has the correct permissions (Send Messages, Embed Links, Attach Files)
- Check that your bot token is valid
- Verify that the required intents are enabled in the Discord Developer Portal

## 🙏 Credits

- Created by [Wick Studio](https://discord.gg/wicks)
- Uses Discord.js for bot functionality
- Uses canvas and gif-encoder-2 for image processing

## 📄 License

MIT License

## 🔗 Support

For support, join our [Discord Server](https://discord.gg/wicks)
