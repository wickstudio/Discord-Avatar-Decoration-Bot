module.exports = (client) => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Bot is serving ${client.guilds.cache.size} servers`);

  const activities = [
    { name: "with avatar decorations ✨", type: 0 }, // Playing
    { name: "your avatar requests", type: 2 },      // Listening to
    { name: "/effect to decorate", type: 3 },       // Watching
    { name: "Try /help for info!", type: 0 }        // Playing
  ];
  
  let currentActivity = 0;
  
  client.user.setPresence({
    activities: [activities[0]],
    status: "online"
  });
  
  setInterval(() => {
    currentActivity = (currentActivity + 1) % activities.length;
    client.user.setPresence({
      activities: [activities[currentActivity]],
      status: "online"
    });
  }, 15 * 60 * 1000);

  client.on("guildCreate", (guild) => {
    console.log(`Joined a new guild: ${guild.name} (${guild.id}) - Total servers: ${client.guilds.cache.size}`);
  });

  client.on("guildDelete", (guild) => {
    console.log(`Left a guild: ${guild.name} (${guild.id}) - Total servers: ${client.guilds.cache.size}`);
  });
};
