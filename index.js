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
        name: 'https://guns.lol/reachdawg',
        type: ActivityType.Listening,
        details: 'reachdawg',
        state: 'klcselx',
        timestamps: {
          start: 1795203251000,
          end: 1903203251000
        },
        discordpp::ActivityAssets assets;
    assets.SetLargeImage("https://github.com/reachdawgzz/discord-rich-presence/blob/main/IMG_3818.jpeg?raw=true");
    assets.SetLargeText("Enchanted Forest");
    assets.SetSmallText("Level 10");
    activity.SetAssets(assets);
        }
      }
    ]
  });

  await startVoiceStay(readyClient);
});

client.login(process.env.BOT_TOKEN);
