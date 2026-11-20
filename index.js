const { Client, GatewayIntentBits, ActivityType, Events } = require('discord.js');
const { startVoiceStay } = require('./voiceStay');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const IMAGE_URL = 'https://github.com/reachdawgzz/discord-rich-presence/blob/main/IMG_3818.jpeg?raw=true';

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);

  await readyClient.application.edit({
    description: 'run by reach https://guns.lol/reachdawg'
  });

  readyClient.user.setPresence({
    status: 'online',
    activities: [
      {
        name: 'ReachDawg',
        type: ActivityType.Listening,
        details: 'https://guns.lol/reachdawg',
        state: 'klcselx',
        timestamps: {
          start: 1795203251000,
          end: 1903203251000
        },
        assets: {
          largeImage: IMAGE_URL,
          largeText: 'ReachDawg'
        }
      }
    ]
  });

  await startVoiceStay(readyClient);
});

client.login(process.env.BOT_TOKEN);
