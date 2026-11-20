const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  client.user.setPresence({
    status: 'online',
    activities: [
      {
        name: 'On an adventure',
        type: ActivityType.Listening
      }
    ]
  });
});

client.login(process.env.BOT_TOKEN);
