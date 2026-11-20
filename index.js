const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  client.user.setPresence({
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
});

client.login(process.env.BOT_TOKEN);
