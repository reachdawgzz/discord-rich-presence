Const { Client, GatewayIntentBits, ActivityType, Events } = require('discord.js');
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

  await startVoiceStay(readyClient);
});

client.login(process.env.BOT_TOKEN);
