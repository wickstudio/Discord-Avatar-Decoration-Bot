/*
██╗    ██╗██╗ ██████╗██╗  ██╗    ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗ 
██║    ██║██║██╔════╝██║ ██╔╝    ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗
██║ █╗ ██║██║██║     █████╔╝     ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║
██║███╗██║██║██║     ██╔═██╗     ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║
╚███╔███╔╝██║╚██████╗██║  ██╗    ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝
 ╚══╝╚══╝ ╚═╝ ╚═════╝╚═╝  ╚═╝    ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝ 
Copyright (c) 2025 Wick Studio | discord.gg/wicks
*/

const {
  Client,
  GatewayIntentBits,
  AttachmentBuilder,
  EmbedBuilder,
  Collection
} = require("discord.js");

const { token, defaultPrefix, cooldown, allowedChannelIds } = require("./config");
const { createGif } = require("./utils/gifGenerator");
const { registerCommands } = require("./commands/slashCommands");
const effectCommand = require("./commands/effect");
const readyEvent = require("./ready");
const effectOptions = require("./effects.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.cooldowns = new Collection();
const activeMenus = new Map();

client.commands.set('effect', effectCommand);

const isChannelAllowed = (channelId) => {
  if (allowedChannelIds.length === 0) {
    return false;
  }
  
  return allowedChannelIds.includes(channelId);
};

client.once("ready", async () => {
  readyEvent(client);
  
  await registerCommands(client);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  
  const prefix = defaultPrefix || "!";
  if (!message.content.startsWith(prefix)) return;
  
  if (!isChannelAllowed(message.channelId)) {
    return message.reply("This bot is disabled in this channel. " + 
      (allowedChannelIds.length > 0 
        ? `Please use it in the designated channels: ${allowedChannelIds.map(id => `<#${id}>`).join(", ")}` 
        : "The bot is currently disabled in all channels. Please contact a server administrator."))
      .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
      .catch(() => {});
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  const now = Date.now();
  const timestamps = client.cooldowns.get(command.name);
  const cooldownAmount = (cooldown || 5) * 1000;

  if (timestamps && timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `Please wait ${timeLeft.toFixed(1)} more second(s) before using the \`${command.name}\` command.`
      );
    }
  }

  if (!timestamps) {
    client.cooldowns.set(command.name, new Collection());
  }
  
  client.cooldowns.get(command.name).set(message.author.id, now);
  setTimeout(() => client.cooldowns.get(command.name).delete(message.author.id), cooldownAmount);

  try {
    await command.execute(message, args, client, activeMenus);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    message.reply("There was an error trying to execute that command!");
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!isChannelAllowed(interaction.channelId)) {
    if (interaction.isCommand()) {
      return interaction.reply({ 
        content: "This bot is disabled in this channel. " + 
          (allowedChannelIds.length > 0 
            ? `Please use it in the designated channels: ${allowedChannelIds.map(id => `<#${id}>`).join(", ")}` 
            : "The bot is currently disabled in all channels. Please contact a server administrator."), 
        ephemeral: true 
      });
    }
    return;
  }

  if (interaction.isAnySelectMenu()) {
    try {
      const effectId = interaction.values[0];
      
      if (!interaction.user.displayAvatarURL()) {
        await interaction.reply({
          content: "Could not get your avatar. Make sure your account has a profile picture.",
          ephemeral: true
        }).catch(() => {});
        return;
      }

      await interaction.deferReply().catch(() => {});

      const avatarUrl = interaction.user
        .displayAvatarURL({ size: 512 })
        .replace("webp", "png");
      
      let effectName = effectId;
      try {
        const effectInfo = effectOptions.find(e => e.id === effectId);
        if (effectInfo && effectInfo.label) {
          effectName = effectInfo.label;
        }
      } catch (error) {
        console.warn("Error finding effect name:", error.message);
      }
        
      await interaction.editReply(`Creating your avatar with **${effectName}** effect... 🎨`).catch(() => {});
      
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('GIF generation timed out')), 30000);
        });
        
        const gifPromise = createGif(avatarUrl, effectId);
        
        const response = await Promise.race([gifPromise, timeoutPromise]);

        if (!response) {
          await interaction.editReply("An error occurred while creating the GIF. Please try again later.").catch(() => {});
          return;
        }

        const attachment = new AttachmentBuilder(response, { name: `avatar_${interaction.user.username}.gif` });
        await interaction.editReply({
          content: `<@${interaction.user.id}> Here's your decorated avatar with **${effectName}** effect! ✨`,
          files: [attachment],
        }).catch(() => {
          console.warn("Failed to send decorated avatar. The interaction might have expired.");
        });
      } catch (gifError) {
        console.error("Error in GIF creation process:", gifError);
        await interaction.editReply("Failed to create your avatar decoration. Please try again or select a different effect.").catch(() => {});
      }
    } catch (error) {
      console.error("Error in select menu handling:", error);
      try {
        if (interaction.deferred) {
          await interaction.editReply("An unexpected error occurred. Please try the command again.").catch(() => {});
        } else {
          await interaction.reply({
            content: "An unexpected error occurred. Please try the command again.",
            ephemeral: true
          }).catch(() => {});
        }
      } catch (replyError) {
        console.error("Could not send error message:", replyError);
      }
    }
    return;
  }

  if (interaction.isButton()) {
    const { customId } = interaction;
    
    if (['prev_category', 'next_category', 'refresh', 'random_effect'].includes(customId)) {
      try {
        const messageId = interaction.message.id;
        const menuInfo = activeMenus.get(messageId);
        
        if (!menuInfo || menuInfo.userId !== interaction.user.id) {
          await interaction.reply({ 
            content: "You cannot use these controls.", 
            ephemeral: true 
          }).catch(error => {
            console.log(`Could not reply to unauthorized user: ${error.message}`);
          });
          return;
        }
        
        const now = Date.now();
        if (menuInfo.timestamp && (now - menuInfo.timestamp > 900000)) {
          await interaction.reply({
            content: "This menu has expired. Please use the command again for a fresh menu.",
            ephemeral: true
          }).catch(error => {
            console.log(`Could not reply to expired menu: ${error.message}`);
          });
          return;
        }
        
        if (customId === 'random_effect') {
          try {
            await interaction.deferReply({ ephemeral: false });
            
            let allEffects = [];
            Object.values(menuInfo.groupedEffects).forEach(effects => {
              allEffects = allEffects.concat(effects);
            });
            
            if (allEffects.length === 0) {
              await interaction.editReply("No effects available to randomly select.").catch(() => {});
              return;
            }
            
            const randomEffect = allEffects[Math.floor(Math.random() * allEffects.length)];
            
            if (!randomEffect) {
              await interaction.editReply("Error selecting a random effect. Please try again.").catch(() => {});
              return;
            }
            
            if (!interaction.user.displayAvatarURL()) {
              await interaction.editReply("Could not get your avatar. Make sure your account has a profile picture.").catch(() => {});
              return;
            }
            
            const avatarUrl = interaction.user
              .displayAvatarURL({ size: 512 })
              .replace("webp", "png");
            
            await interaction.editReply(`Creating your avatar with **${randomEffect.label || randomEffect.id}** effect... 🎨`).catch(() => {});
            
            try {
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('GIF generation timed out')), 30000);
              });
              
              const gifPromise = createGif(avatarUrl, randomEffect.id);
              
              const response = await Promise.race([gifPromise, timeoutPromise]);
              
              if (!response) {
                await interaction.editReply("An error occurred while creating the GIF. Please try again later.").catch(() => {});
                return;
              }
              
              const attachment = new AttachmentBuilder(response, { name: `avatar_${interaction.user.username}_random.gif` });
              await interaction.editReply({
                content: `<@${interaction.user.id}> Here's your randomly decorated avatar with **${randomEffect.label || randomEffect.id}** effect! ✨`,
                files: [attachment],
              }).catch(() => {});
            } catch (gifError) {
              console.error("Error creating random effect GIF:", gifError);
              await interaction.editReply(`Error creating the GIF. Please try a different effect.`).catch(() => {});
            }
            return;
          } catch (error) {
            console.error("Error processing random effect:", error);
            try {
              if (interaction.deferred) {
                await interaction.editReply("An error occurred while processing the random effect. Please try again.").catch(() => {});
              } else {
                await interaction.reply({ 
                  content: "An error occurred while processing the random effect. Please try again.",
                  ephemeral: true 
                }).catch(() => {});
              }
            } catch (replyError) {
              console.warn(`Could not send error message: ${replyError.message}`);
            }
            return;
          }
        }
        
        if (customId === 'refresh') {
          try {
            await interaction.deferUpdate().catch(() => {});
            
            menuInfo.categoryPage = {};
            menuInfo.timestamp = Date.now();
            
            const { components, totalCategoryPages } = effectCommand.createSelectMenus(
              menuInfo.page, 
              menuInfo.categoryPage
            );
            const newEmbed = effectCommand.createEffectCommandEmbed(
              menuInfo.page, 
              menuInfo.totalPages
            );
            
            await interaction.editReply({
              content: `<@${interaction.user.id}>, here are the available decorations:`,
              embeds: [newEmbed],
              components: components
            }).catch(error => {
              console.log(`Failed to update refresh: ${error.message}`);
            });
          } catch (error) {
            console.error("Error refreshing message:", error);
          }
          return;
        }
        
        if (customId === 'next_category' || customId === 'prev_category') {
          try {
            await interaction.deferUpdate().catch(() => {});
            
            menuInfo.timestamp = Date.now();
            const { currentPageCategories } = effectCommand.createSelectMenus(menuInfo.page, menuInfo.categoryPage);
            
            for (const category of currentPageCategories) {
              const effects = menuInfo.groupedEffects[category];
              const maxOptionsPerMenu = 25;
              const totalPagesForCategory = Math.ceil(effects.length / maxOptionsPerMenu);
              
              if (menuInfo.categoryPage[category] === undefined) {
                menuInfo.categoryPage[category] = 0;
              }
              
              if (customId === 'next_category') {
                menuInfo.categoryPage[category] = (menuInfo.categoryPage[category] + 1) % totalPagesForCategory;
              } else {
                menuInfo.categoryPage[category] = (menuInfo.categoryPage[category] - 1 + totalPagesForCategory) % totalPagesForCategory;
              }
            }
        
            const { components } = effectCommand.createSelectMenus(menuInfo.page, menuInfo.categoryPage);
            const newEmbed = effectCommand.createEffectCommandEmbed(menuInfo.page, menuInfo.totalPages);
            
            await interaction.editReply({
              content: `<@${interaction.user.id}>, here are the available decorations:`,
              embeds: [newEmbed],
              components: components
            }).catch(error => {
              console.log(`Failed to navigate: ${error.message}`);
            });
          } catch (error) {
            console.error("Error updating navigation:", error);
          }
        }
        return;
      } catch (buttonError) {
        console.error("Unexpected button error:", buttonError);
      }
    }
  }

  if (interaction.isChatInputCommand()) {
    try {
      const commandName = interaction.commandName;
      
      if (commandName === 'effect') {
        if (!interaction.user.displayAvatarURL()) {
          await interaction.reply({
            content: "You need to have a profile picture to use this command.",
            ephemeral: true
          });
          return;
        }
        
        const page = 0;
        const categoryPage = {};
        
        const { components, totalCategoryPages } = effectCommand.createSelectMenus(page, categoryPage);
        const effectCommandEmbed = effectCommand.createEffectCommandEmbed(page, totalCategoryPages);

        try {
          const reply = await interaction.reply({
            content: `<@${interaction.user.id}>, here are the available decorations:`,
            embeds: [effectCommandEmbed],
            components: components,
            fetchReply: true
          });
          
          activeMenus.set(reply.id, {
            userId: interaction.user.id,
            page: 0,
            totalPages: totalCategoryPages,
            categoryPage: categoryPage,
            groupedEffects: effectCommand.groupedEffects,
            timestamp: Date.now()
          });
          
          setTimeout(() => {
            if (activeMenus.has(reply.id)) {
              activeMenus.delete(reply.id);
              
              try {
                interaction.editReply({
                  content: `<@${interaction.user.id}>, this menu has expired. Use the command again to see available decorations.`,
                  components: [],
                  embeds: []
                }).catch(() => {});
              } catch (e) {
              }
            }
          }, 600000);
        } catch (menuError) {
          console.error("Error creating effect menu:", menuError);
          await interaction.followUp({
            content: "An error occurred while creating the effect menu. Please try again later.",
            ephemeral: true
          });
        }
      } 
      else if (commandName === 'help') {
        try {
          const helpEmbed = new EmbedBuilder()
            .setColor('#FFDF00')
            .setTitle('🌟 Avatar Decoration Bot 🌟')
            .setDescription('Enhance your Discord profile picture with premium decorative effects!')
            .addFields([
              { 
                name: '🎮 Commands', 
                value: '`/effect` - Open the avatar decoration menu\n' +
                      '`/help` - Show this help message\n' +
                      '`/ping` - Check bot latency'
              },
              { 
                name: '❔ How To Use', 
                value: '1. Use the `/effect` command\n2. Select a decoration from the menus\n3. The bot will reply with your decorated avatar GIF' 
              },
              { 
                name: '✨ Features', 
                value: '• **Random Decorations**: Use the 🎲 button to get a random effect\n' +
                      '• **Multiple Categories**: Browse different types of decorations\n' +
                      '• **High Quality Output**: Receive high-resolution avatar GIFs\n' +
                      '• **Channel Restrictions**: Bot only works in designated channels'
              },
              { 
                name: '🛡️ Restrictions', 
                value: allowedChannelIds.length > 0 
                  ? `This bot only works in ${allowedChannelIds.length} specific channels. ${allowedChannelIds.map(id => `<#${id}>`).join(", ")}`
                  : `The bot is currently disabled in all channels. Please contact a server administrator to enable it.`
              },
              { 
                name: '🔗 Links', 
                value: '[Support Server](https://discord.gg/wicks) | [GitHub](https://github.com/wickstudio/discord-avatar-decoration-bot)'
              }
            ])
            .setFooter({ text: 'Made with ❤️ by Wick Studio • ' + new Date().toLocaleDateString() });

          await interaction.reply({ embeds: [helpEmbed] });
        } catch (helpError) {
          console.error("Error showing help:", helpError);
          await interaction.reply({
            content: "An error occurred while showing the help menu. Please try again later.",
            ephemeral: true
          });
        }
      }
      else if (commandName === 'ping') {
        try {
          const sent = await interaction.reply({ 
            content: '🏓 Pinging...', 
            fetchReply: true 
          });
          
          const ping = sent.createdTimestamp - interaction.createdTimestamp;
          const apiPing = Math.round(client.ws.ping);
          
          await interaction.editReply(
            `📶 **Ping Results:**\n` +
            `> Roundtrip: \`${ping}ms\`\n` +
            `> WebSocket: \`${apiPing}ms\``
          ).catch(() => {
            console.warn("Failed to edit ping reply. The interaction might have expired.");
          });
        } catch (pingError) {
          console.error("Error during ping command:", pingError);
          await interaction.reply({
            content: "An error occurred while checking ping. Please try again later.",
            ephemeral: true
          }).catch(() => {});
        }
      }
    } catch (error) {
      console.error("Error processing slash command:", error);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "An error occurred while processing your command. Please try again later.",
            ephemeral: true
          }).catch(() => {});
        } else {
          await interaction.followUp({
            content: "An error occurred while processing your command. Please try again later.",
            ephemeral: true
          }).catch(() => {});
        }
      } catch (replyError) {
        console.error("Could not send error message:", replyError);
      }
    }
  }
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  logError('Unhandled Promise Rejection', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  logError('Uncaught Exception', error);
});

function logError(type, error) {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    type,
    message: error.message,
    stack: error.stack,
  };
  
  console.error(`[${timestamp}] ERROR DETAILS:`, JSON.stringify(errorDetails, null, 2));
}

console.log("Starting Discord Avatar Decoration Bot...");
if (allowedChannelIds.length === 0) {
  console.log("Channel Restrictions: Bot is disabled in all channels");
} else {
  console.log(`Channel Restrictions: Enabled for ${allowedChannelIds.length} specific channels`);
  console.log(`Allowed Channel IDs: ${allowedChannelIds.join(", ")}`);
}

try {
  client.login(token)
    .then(() => {
      console.log("Login successful! Bot is online.");
    })
    .catch(err => {
      console.error('Failed to login to Discord:', err.message);
      
      if (err.message.includes('TOKEN_INVALID')) {
        console.error('ERROR: The bot token you provided is invalid. Please check your .env file or config.js settings.');
      } else if (err.message.includes('DISALLOWED_INTENTS')) {
        console.error('ERROR: The bot is trying to use intents that are not enabled in the Discord Developer Portal.');
        console.error('Please enable the required intents (GUILDS, GUILD_MESSAGES, MESSAGE_CONTENT) in the Discord Developer Portal.');
      }
      
      process.exit(1);
    });
} catch (error) {
  console.error('Unexpected error during startup:', error);
  process.exit(1);
}
