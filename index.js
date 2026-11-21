const {
  Client,
  GatewayIntentBits,
  ActivityType,
  Events,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { startVoiceStay } = require('./voiceStay');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const IMAGE_URL = 'https://raw.githubusercontent.com/reachdawgzz/discord-rich-presence/main/IMG_3818.jpeg';

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);

  await readyClient.application.edit({
    description: 'run by reach                                             https://guns.lol/reachdawg'
  });

  readyClient.user.setPresence({
    status: 'online',
    activities: [
      {
        name: 'guns.lol/reachdawg',
        type: ActivityType.Listening,
        details: 'reachdawg',
        state: 'LOL.',
        timestamps: {
          start: 1795203251000,
          end: 1903203251000
        },
        assets: {
          largeImage: IMAGE_URL,
          largeText: 'ReachDawg',
          smallText: 'Level 10'
        }
      }
    ]
  });

  const linkCommand = new SlashCommandBuilder()
    .setName('link')
    .setDescription('Get ReachDawg link');

  await readyClient.application.commands.set([linkCommand]);

  await startVoiceStay(readyClient);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'link') {
    const button = new ButtonBuilder()
      .setLabel('Webs')
      .setURL('https://guns.lol/reachdawg')
      .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      content: 'Check out my profile:',
      components: [row]
    });
  }
});

client.login(process.env.BOT_TOKEN);
