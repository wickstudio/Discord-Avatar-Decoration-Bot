const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { token, guildId } = require('../config');

const commands = [
  new SlashCommandBuilder()
    .setName('effect')
    .setDescription('Enhance your profile picture with unique visual effects')
    .setDMPermission(false),
  
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows information about the bot and available commands')
    .setDMPermission(true),
    
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\'s response time and connection status')
    .setDMPermission(true)
]
.map(command => command.toJSON());

const registerCommands = async (client) => {
  try {
    console.log('Started refreshing application (/) commands.');
    
    const rest = new REST({ version: '10' }).setToken(token);
    
    if (guildId) {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guildId),
        { body: commands },
      );
      console.log(`Successfully registered application commands for guild ID: ${guildId}`);
    }
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    
    console.log('Successfully registered global application commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
};

module.exports = { registerCommands };