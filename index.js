const { Client, GatewayIntentBits, ActivityType, Events } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);

  readyClient.user.setPresence({
    status: 'online',
    activities: [
      {
        name: 'ReachDawg',
        type: ActivityType.Listening
      }
    ]
  });
});

client.login(process.env.BOT_TOKEN);
