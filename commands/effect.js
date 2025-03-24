const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const effectOptions = require('../effects.json');

function formatDiscordEmoji(emojiString) {
  if (!emojiString) return '✨';
  
  if (!emojiString.includes(':')) return emojiString;
  
  if (emojiString.startsWith('<') && emojiString.endsWith('>')) {
    return emojiString;
  }
  
  const parts = emojiString.split(':');
  if (parts.length >= 3) {
    const isAnimated = emojiString.startsWith('a:');
    const name = parts[1];
    const id = parts[2].replace('>', '');
    return `<${isAnimated ? 'a:' : ':'}${name}:${id}>`;
  } else if (parts.length === 2) {
    const name = parts[0];
    const id = parts[1].replace('>', '');
    return `<:${name}:${id}>`;
  }
  
  return '✨';
}

effectOptions.forEach(effect => {
  if (!effect.emoji) {
    effect.emoji = '✨';
  } else {
    effect.emoji = formatDiscordEmoji(effect.emoji);
  }
});

const groupedEffects = effectOptions.reduce((acc, effect) => {
  acc[effect.category] = (acc[effect.category] || []).concat(effect);
  return acc;
}, {});

const totalEffectsCount = effectOptions.length;
const categoriesCount = Object.keys(groupedEffects).length;

const createEffectCommandEmbed = (page = 0, totalPages = 1) => {
  const randomEffects = effectOptions
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(effect => {
      return `• **${effect.label || effect.id}**`;
    });

  return new EmbedBuilder()
    .setColor("#FFDF00")
    .setTitle("✨ `Decorate Your Avatar!` ✨")
    .setDescription("**[WickStudio](https://discord.gg/wicks) - Transform your profile picture with unique visual effects**")
    .addFields([
      {
        name: "**🎭 Available Categories:**",
        value: Object.keys(groupedEffects)
          .map(category => `**${getEmoji(category)} ${category}** (${groupedEffects[category].length} effects)`)
          .join('\n'),
        inline: false
      },
      {
        name: "**🌟 Featured Effects:**",
        value: randomEffects.join('\n'),
        inline: true
      },
      {
        name: "**📊 Stats:**",
        value: `Total Effects: **${totalEffectsCount}**\nCategories: **${categoriesCount}**\nLast Updated: **${new Date().toLocaleDateString()}**`,
        inline: true
      }
    ])
    .setImage("https://i.imgur.com/4m0b8w3.png")
    .setFooter({ 
      text: `Select a category below • Page ${page + 1}/${totalPages} • Updated ${new Date().toLocaleDateString()}`
    });
};

function getEmoji(category) {
  const emojiMap = {
    'Seasonal': '🎄',
    'Simple': '🌈',
    'Animated': '🎬',
    'Gradient': '🌌',
    'Border': '🔲',
    'Flags': '🏳️',
    'Sparkles': '✨',
    'Flames': '🔥'
  };
  
  return emojiMap[category] || '🎨';
}

const createSelectMenus = (page = 0, categoryPage = {}) => {
  const categories = Object.keys(groupedEffects);
  const maxOptionsPerMenu = 25;
  const maxMenusPerPage = 4;
  const totalCategoryPages = Math.ceil(categories.length / maxMenusPerPage);
  const startCategoryIdx = page * maxMenusPerPage;
  const endCategoryIdx = Math.min(startCategoryIdx + maxMenusPerPage, categories.length);
  const currentPageCategories = categories.slice(startCategoryIdx, endCategoryIdx);
  const components = [];

  for (let i = 0; i < currentPageCategories.length && components.length < 4; i++) {
    const category = currentPageCategories[i];
    const effects = groupedEffects[category];
    const currentCategoryPage = categoryPage[category] || 0;
    const totalPagesForCategory = Math.ceil(effects.length / maxOptionsPerMenu);
    const startEffectIdx = currentCategoryPage * maxOptionsPerMenu;
    const endEffectIdx = Math.min(startEffectIdx + maxOptionsPerMenu, effects.length);
    const currentPageEffects = effects.slice(startEffectIdx, endEffectIdx);
    
    const options = currentPageEffects.map(effect => ({
      label: `${effect.label || effect.id}`.slice(0, 99),
      value: `${effect.id}`,
      emoji: effect.emoji,
      description: `Apply ${effect.label || effect.id} to your avatar`
    }));
    
    const menuLabel = totalPagesForCategory > 1 
      ? `${category} (${currentCategoryPage + 1}/${totalPagesForCategory})` 
      : category;
    
    components.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`select-${category}-${currentCategoryPage}`)
          .setPlaceholder(`${menuLabel} - Choose an effect`)
          .addOptions(options)
      )
    );
  }
  
  const navigationRow = new ActionRowBuilder();
  
  navigationRow.addComponents(
    new ButtonBuilder()
      .setCustomId('prev_category')
      .setLabel('Previous')
      .setEmoji('<:wick4:1244188825916280902>')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(Object.values(categoryPage).every(page => page === 0))
  );
  
  navigationRow.addComponents(
    new ButtonBuilder()
      .setCustomId('refresh')
      .setLabel('Refresh')
      .setEmoji('<:wick30:1244189081827676232>')
      .setStyle(ButtonStyle.Secondary)
  );
  
  navigationRow.addComponents(
    new ButtonBuilder()
      .setCustomId('random_effect')
      .setLabel('Random')
      .setEmoji('<:wick29:1244189085589962752>')
      .setStyle(ButtonStyle.Secondary)
  );
  
  navigationRow.addComponents(
    new ButtonBuilder()
      .setCustomId('next_category')
      .setLabel('Next')
      .setEmoji('<:wick2:1244188791577772092>')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(false)
  );
  
  if (components.length > 0) {
    components.push(navigationRow);
  }
  
  return {
    components,
    totalCategoryPages,
    currentPageCategories
  };
};

module.exports = {
  name: 'effect',
  description: 'Enhance your profile picture with unique visual effects',
  async execute(message, args, client, activeMenus) {
    if (!message.author.displayAvatarURL()) {
      return message.reply("You need to have a profile picture to use this command.");
    }
    
    const page = 0;
    const categoryPage = {};
    
    const { components, totalCategoryPages } = createSelectMenus(page, categoryPage);
    const effectCommandEmbed = createEffectCommandEmbed(page, totalCategoryPages);

    try {
      const reply = await message.reply({
        content: `<@${message.author.id}>, here are the available decorations:`,
        embeds: [effectCommandEmbed],
        components: components,
      });
      
      activeMenus.set(reply.id, {
        userId: message.author.id,
        page: 0,
        totalPages: totalCategoryPages,
        categoryPage: categoryPage,
        groupedEffects: groupedEffects,
        timestamp: Date.now()
      });
      
      setTimeout(() => {
        if (activeMenus.has(reply.id)) {
          activeMenus.delete(reply.id);
          try {
            reply.edit({
              content: `<@${message.author.id}>, this menu has expired. Use the command again to see available decorations.`,
              components: []
            }).catch(() => {});
          } catch (e) {
          }
        }
      }, 600000);
    } catch (error) {
      console.error("Error sending message:", error);
      message.reply("An error occurred while creating the effect menu. Please try again later.");
    }
  },
  createSelectMenus,
  createEffectCommandEmbed,
  groupedEffects,
  totalEffectsCount,
  categoriesCount
};