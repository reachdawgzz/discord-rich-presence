const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');

const GUILD_ID = '907163834597376080';
const VOICE_CHANNEL_ID = '1277271631101821071';

function connectToGuildVoice(guild, attempt = 1) {
  const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
  if (!channel || !channel.isVoiceBased()) {
    console.error('[voiceStay] Voice channel not found or not a voice channel.');
    return;
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: true
  });

  connection.on(VoiceConnectionStatus.Ready, () => {
    console.log(`[voiceStay] Connected and staying in VC: ${channel.name}`);
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
      ]);
    } catch {
      connection.destroy();
      const delayMs = Math.min(5_000 * attempt, 30_000);
      console.log(`[voiceStay] Disconnected. Rejoining in ${delayMs / 1000}s...`);
      setTimeout(() => connectToGuildVoice(guild, attempt + 1), delayMs);
    }
  });

  connection.on('error', (err) => {
    console.error('[voiceStay] Voice connection error:', err);
  });
}

async function startVoiceStay(client) {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.channels.fetch();
    connectToGuildVoice(guild);
  } catch (err) {
    console.error('[voiceStay] Failed to initialize voice channel:', err);
  }
}

module.exports = { startVoiceStay };
