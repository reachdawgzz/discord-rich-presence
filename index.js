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
const OWNER_ID = '1058688233782902846'; // Optional: paste your Discord User ID
const IMAGE_URL = 'https://raw.githubusercontent.com/reachdawgzz/discord-rich-presence/main/IMG_3818.jpeg';
const AI_PREFIX = '~';

// Human-like personality that understands Khmer, SingKhmer (Romanized Khmer), and English
const SYSTEM_PROMPT = `
You are ReachDawg, a chill, witty friend hanging out in a private Discord server with close friends.
Rules for how you talk:
- Language matching: Detect the user's language and match it naturally:
  1. If they write in Khmer script (ភាសាខ្មែរ), reply in casual, everyday spoken Khmer.
  2. If they write in SingKhmer / Romanized Khmer (e.g., "jg", "ot ey te", "mdech hz", "nham bay nov", "chkuot", "ah bro", "kom chkuot", "men ten"), reply in the same SingKhmer + English friend-group style.
  3. If they write in English, reply in casual Discord English.
  4. If they mix Khmer and English, mix them naturally just like a real Cambodian friend texting.
- Talk like a real person texting close friends on Discord: lowercase, short sentences, casual banter, light roasting, and everyday local slang.
- Keep replies brief (1 to 3 sentences max unless someone specifically asks for a longer explanation).
- Never use bullet points, numbered lists, or formal headers.
- Never say "As an AI", "I'm an AI assistant", or lecture people about language.
- Keep banter playful between friends—do not generate hate speech, slurs against protected groups, or threats.
`.trim();

// Stores the last 8 messages per channel so the AI remembers the conversation
const channelMemory = new Map();

function addToMemory(channelId, role, content) {
  const history = channelMemory.get(channelId) || [];
  history.push({ role, content: content.slice(0, 1000) });
  if (history.length > 8) history.shift();
  channelMemory.set(channelId, history);
}

// Check if user is Bot Owner or Server Admin
function isOwnerOrAdmin(interaction) {
  if (interaction.user.id === OWNER_ID) return true;
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;
}

// Slash Commands (/kick, /links, /ping)
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

// Fetch active chat models directly from Groq
async function getAvailableGroqModels(apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status} fetching models: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const allIds = (data?.data || [])
    .map(m => m.id)
    .filter(id => !id.includes('whisper') && !id.includes('guard') && !id.includes('tts'));

  const preferred = allIds.filter(id => /llama|qwen|gemma|mixtral|deepseek/i.test(id));
  return [...new Set([
    (process.env.AI_MODEL || '').trim(),
    ...preferred,
    ...allIds
  ])].filter(Boolean);
}

// Groq AI Chat Helper with Human Personality + Memory
async function askAI(channelId, username, prompt, previousBotMessage = null) {
  const apiKey = (process.env.AI_API_KEY || '').trim();
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  if (!apiKey) {
    throw new Error('AI is not configured yet. Add `AI_API_KEY` in Railway Variables.');
  }

  const modelsToTry = await getAvailableGroqModels(apiKey);
  if (!modelsToTry.length) {
    throw new Error('No active chat models found on your Groq account.');
  }

  const history = channelMemory.get(channelId) || [];
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];

  if (previousBotMessage && !history.some(m => m.content === previousBotMessage)) {
    messages.push({ role: 'assistant', content: previousBotMessage.slice(0, 1000) });
  }

  const userMessage = `${username}: ${prompt}`;
  messages.push({ role: 'user', content: userMessage });

  let lastError = 'Unknown AI error';

  for (const model of modelsToTry.slice(0, 5)) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.85,
        max_tokens: 180
      })
    });

    if (res.ok) {
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content?.trim() || 'idk what to say lol';

      addToMemory(channelId, 'user', userMessage);
      addToMemory(channelId, 'assistant', reply);

      return reply;
    }

    const errText = await res.text();
    lastError = `HTTP ${res.status} (${model}): ${errText.slice(0, 250)}`;

    if (res.status !== 404 && res.status !== 400) {
      throw new Error(lastError);
    }
  }

  throw new Error(lastError);
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);

  // 1. Register Slash Commands
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

  // 2. Update Bot About Me
  await readyClient.application.edit({
    description: 'run by reach https://guns.lol/reachdawg'
  });

  // 3. Set Bot Presence
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

  // 4. Join & Stay in Voice Channel
  await startVoiceStay(readyClient);
});

// Handle ~ Prefix AND Direct Replies to the Bot
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  const startsWithPrefix = message.content.startsWith(AI_PREFIX);
  let repliedToBot = false;
  let previousBotText = null;

  if (!startsWithPrefix && message.reference?.messageId) {
    try {
      const referencedMsg = await message.fetchReference();
      if (referencedMsg.author.id === client.user.id) {
        repliedToBot = true;
        previousBotText = referencedMsg.content;
      }
    } catch {
      // Ignore deleted/inaccessible references
    }
  }

  if (!startsWithPrefix && !repliedToBot) return;

  const prompt = startsWithPrefix
    ? message.content.slice(AI_PREFIX.length).trim()
    : message.content.trim();

  if (!prompt) return;

  await message.channel.sendTyping();
  try {
    const displayName = message.member?.displayName || message.author.username;
    const answer = await askAI(message.channel.id, displayName, prompt, previousBotText);
    await message.reply(answer.slice(0, 1900));
  } catch (err) {
    console.error('[AI Error]:', err);
    const errReply = await message.reply(`AI Error: \`${err.message}\``).catch(() => null);
    if (errReply) {
      setTimeout(() => {
        errReply.delete().catch(() => {});
      }, 5000);
    }
  }
});

// Handle Slash Commands (/kick, /links, /ping)
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

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
