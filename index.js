const { Client, GatewayIntentBits, ActivityType, Events } = require('discord.js');
const { startVoiceStay } = require('./voiceStay');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);

  readyClient.user.setPresence({
    status: 'online',
    activities: [
      {
        name: 'ReachDawg',
        type: ActivityType.Listening,
        details: 'ReachDawg',
        state: 'klcselx',
        timestamps: {
          start: 1795203251000,
          end: 1903203251000
        }
      }
    ]
  });

  await startVoiceStay(readyClient);
});

client.login(process.env.BOT_TOKEN);
