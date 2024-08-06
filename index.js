const {
  Client,
  GatewayIntentBits,
  AttachmentBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js")
const { createCanvas, loadImage } = require("canvas");
const GIFEncoder = require("gif-encoder-2");
const gifken = require("gifken");
const downloadAPNG = require("./utils");
const effectOptions = require("./effects.json");
const { token, guildId } = require("./config");
const readyEvent = require("./ready");

const client = new 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const createGif = async (imageUrl, effectID) => {
  try {
    const img = await loadImage(imageUrl);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");

    const encoder = new GIFEncoder(img.width, img.height, "octree", true);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(100);

    const effectUrl = effectOptions.find((effect) => effect.id === effectID);
    if (!effectUrl) {
      throw new Error(`Effect with ID ${effectID} not found.`);
    }

    const frames = await downloadAPNG(effectUrl.url);
    console.log(`Number of frames: ${frames.length}`);

    for (const frameFile of frames) {
      const buffer = await frameFile.toFormat("png").toBuffer();
      const frameImage = await loadImage(buffer);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);

      encoder.addFrame(ctx);
    }

    encoder.finish();
    const buffer = encoder.out.getData();

    const reversedBuffer = await gifken.reverse(buffer);
    return Buffer.from(reversedBuffer);
  } catch (error) {
    console.error("Error creating GIF:", error);
    return null;
  }
};

const createSelectMenus = () => {
  const groupedEffects = effectOptions.reduce((acc, effect) => {
    acc[effect.category] = (acc[effect.category] || []).concat(effect);
    return acc;
  }, {});

  return Object.entries(groupedEffects)
    .map(([category, effects], index) => {
      const chunks = [];
      for (let i = 0; i < effects.length; i += 25) {
        chunks.push(effects.slice(i, Math.min(i + 25, effects.length)));
      }

      const selectMenus = chunks.map((chunk, index) => {
        const menu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`select-${index + 1 * Math.random()}`)
            .setPlaceholder(`Select an effect from ${category}`) 
            .addOptions(
              chunk.map((effect) => ({
                label: `${effect.label || effect.id}`.slice(0, 99),
                value: `${effect.id}`,
                emoji: effect.emoji,
              }))
            )
        );
        return menu;
      });
      return selectMenus;
    })
    .flat();
};

const createEffectCommandEmbed = () => {
  return new EmbedBuilder()
    .setColor("#3498db")
    .setTitle("Decorate Your Avatar!")
    .setDescription("Enhance your profile picture with unique visual effects.")
    .addFields({
      name: "Available Effects:",
      value: "- Flags\n- Discord decorations",
    })
    .setImage("https://i.imgur.com/4m0b8w3.png")
    .setFooter({ text: "Click the buttons below to choose an effect." });
};

client.once("ready", () => readyEvent(client));

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  if (commandName !== "effect") return;

  const selectMenus = createSelectMenus();
  const effectCommandEmbed = createEffectCommandEmbed();

  await interaction.reply({
    embeds: [effectCommandEmbed],
    components: selectMenus,
  });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isAnySelectMenu()) return;

  const effectName = interaction.values[0];
  if (!interaction.user.displayAvatarURL()) {
    return;
  }

  await interaction.deferReply();

  const avatarUrl = interaction.user
    .displayAvatarURL({ size: 256 })
    .replace("webp", "png");
  const response = await createGif(avatarUrl, effectName);

  if (!response) {
    await interaction.editReply("An error occurred while creating the GIF.");
    return;
  }

  const attachment = new AttachmentBuilder(response, { name: "avatar.gif" });
  await interaction.editReply({
    content: `<@${interaction.user.id}>`,
    files: [attachment],
  });
});

client.on("unhandledRejection", (reason, p) => {
  console.error(" [antiCrash] :: Unhandled Rejection/Catch", reason, p);
});

client.on("uncaughtException", (err, origin) => {
  console.error(" [antiCrash] :: Uncaught Exception/Catch", err, origin);
});

client.on("uncaughtExceptionMonitor", (err, origin) => {
  console.error(
    " [antiCrash] :: Uncaught Exception/Catch (MONITOR)",
    err,
    origin
  );
});

client.login(token);
