const {
  Client,
  GatewayIntentBits,
  ActivityType,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { startVoiceStay } = require('./voiceStay');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const GUILD_ID = '907163834597376080';
const OWNER_ID = 'YOUR_DISCORD_USER_ID'; // <-- Paste your Discord User ID here
const IMAGE_URL = 'https://raw.githubusercontent.com/reachdawgzz/discord-rich-presence/main/IMG_3818.jpeg';
const AI_PREFIX = '~';

// Helper to check if the user is YOU or an Administrator
function isOwnerOrAdmin(interaction) {
  if (interaction.user.id === OWNER_ID) return true;
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;
}

// Define Slash Commands
const commands = [
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server (Owner/Admin only)')
    .addUserOption(option =>
      option.setName('user').setDescription('The member to kick').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for the kick').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('links')
    .setDescription('Show ReachDawg links and profile card'),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is online and view response speed')
].map(cmd => cmd.toJSON());

// Helper function for AI Chat
async function askAI(prompt) {
  const apiKey = process.env.AI_API_KEY;
  const endpoint = process.env.AI_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return 'AI is not configured yet. Add `AI_API_KEY` in your Railway Variables tab to enable `~` AI chat.';
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful, concise Discord assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 400
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI API error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || 'No response returned from AI.';
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);

  try {
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    await rest.put(
      Routes.applicationGuildCommands(readyClient.user.id, GUILD_ID),
      { body: commands }
    );
    console.log('Successfully registered slash commands!');
  } catch (err) {
    console.error('Failed to register slash commands:', err);
  }

  await readyClient.application.edit({
    description: 'run by reach https://guns.lol/reachdawg'
  });

  readyClient.user.setPresence({
    status: 'online',
    activities: [
      {
        name: 'guns.lol/reachdawg',
        type: ActivityType.Listening,
        details: 'reachdawg',
        state: 'klcselx',
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

// ~ AI Chat (Open to everyone)
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(AI_PREFIX)) return;

  const prompt = message.content.slice(AI_PREFIX.length).trim();
  if (!prompt) return;

  await message.channel.sendTyping();
  try {
    const answer = await askAI(prompt);
    await message.reply(answer.slice(0, 1900));
  } catch (err) {
    console.error('[AI Error]:', err);
    await message.reply('Something went wrong talking to the AI service.');
  }
});

// Slash Commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Public commands (Everyone)
  if (interaction.commandName === 'ping') {
    await interaction.reply(`Pong! Latency is **${client.ws.ping}ms**.`);
  }

  if (interaction.commandName === 'links') {
    const embed = new EmbedBuilder()
      .setTitle('ReachDawg')
      .setDescription('Check out my socials and project links below.')
      .setColor(0x5865F2)
      .setImage(IMAGE_URL);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('guns.lol')
        .setStyle(ButtonStyle.Link)
        .setURL('https://guns.lol/reachdawg'),
      new ButtonBuilder()
        .setLabel('GitHub')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com/reachdawgzz/discord-rich-presence')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  // Restricted commands (You or Admins only)
  if (interaction.commandName === 'kick') {
    if (!isOwnerOrAdmin(interaction)) {
      return interaction.reply({ content: 'Only the bot owner or server admins can use this command.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.reply({ content: 'Could not find that member in this server.', ephemeral: true });
    }
    if (!targetMember.kickable) {
      return interaction.reply({ content: 'I cannot kick this user (make sure my bot role is above theirs).', ephemeral: true });
    }

    await targetMember.kick(reason);
    await interaction.reply(`Kicked **${targetUser.tag}** | Reason: ${reason}`);
  }
});

client.login(process.env.BOT_TOKEN);
