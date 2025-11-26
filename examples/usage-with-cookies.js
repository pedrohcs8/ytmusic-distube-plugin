// Example usage of ytmusic-distube-plugin with cookie authentication

const { DisTube } = require('distube');
const YouTubeMusicPlugin = require('ytmusic-distube-plugin');
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

// ==============================================
// Example 1: Basic usage without authentication
// ==============================================
const distube1 = new DisTube({
  emitNewSongOnly: true,
  plugins: [
    new YouTubeMusicPlugin()
  ],
});

// ==============================================
// Example 2: Using cookies from file path
// ==============================================
const distube2 = new DisTube({
  emitNewSongOnly: true,
  plugins: [
    new YouTubeMusicPlugin({
      cookiesPath: './cookies.json'
    })
  ],
});

// ==============================================
// Example 3: Using cookies from array
// ==============================================
const fs = require('fs');
const cookies = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));

const distube3 = new DisTube({
  emitNewSongOnly: true,
  plugins: [
    new YouTubeMusicPlugin({
      cookies: cookies
    })
  ],
});

// ==============================================
// Example 4: With automatic cookie refresh (RECOMMENDED)
// ==============================================
const distube4 = new DisTube({
  emitNewSongOnly: true,
  plugins: [
    new YouTubeMusicPlugin({
      cookiesPath: './cookies.json',
      cookieRefresh: {
        refreshInterval: 86400000, // 24 hours
        refreshBeforeExpiry: 3600000, // 1 hour
        autoRefresh: true,
        headless: true // Set to false for first-time setup
      }
    })
  ],
});

// ==============================================
// Example 5: Advanced configuration with all options
// ==============================================
const distube5 = new DisTube({
  emitNewSongOnly: true,
  plugins: [
    new YouTubeMusicPlugin({
      // Plugin options
      emitEventsAfterFetching: true,
      fetchBeforeQueued: false,
      parallel: true,
      maxViews: 20,
      
      // Cookie authentication
      cookiesPath: './cookies.json',
      
      // Agent options for ytdl-core
      agentOptions: {
        pipelining: 5,
        maxRedirections: 0,
      },
      
      // Cookie auto-refresh
      cookieRefresh: {
        cookiesPath: './cookies.json',
        refreshInterval: 24 * 60 * 60 * 1000, // 24 hours
        refreshBeforeExpiry: 60 * 60 * 1000, // 1 hour
        autoRefresh: true,
        headless: true
      }
    })
  ],
});

// ==============================================
// Example 6: Manual cookie refresh control
// ==============================================
const ytMusicPlugin = new YouTubeMusicPlugin({
  cookiesPath: './cookies.json',
  cookieRefresh: {
    autoRefresh: false // Disable auto-refresh, control manually
  }
});

const distube6 = new DisTube({
  emitNewSongOnly: true,
  plugins: [ytMusicPlugin],
});

// Manually refresh cookies when needed
async function refreshCookiesManually() {
  if (ytMusicPlugin.cookieManager) {
    console.log('Manually refreshing cookies...');
    const freshCookies = await ytMusicPlugin.cookieManager.refreshCookies();
    if (freshCookies) {
      console.log('Cookies refreshed successfully!');
    }
  }
}

// ==============================================
// Bot commands
// ==============================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;
  
  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  // Play YouTube Music
  if (command === 'play') {
    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
      return message.reply('You need to be in a voice channel!');
    }
    
    const query = args.join(' ');
    if (!query) {
      return message.reply('Please provide a song name or URL!');
    }
    
    try {
      await distube4.play(voiceChannel, query, {
        member: message.member,
        textChannel: message.channel,
        message,
      });
    } catch (error) {
      console.error('Play error:', error);
      message.reply(`Error: ${error.message}`);
    }
  }
  
  // Manually refresh cookies
  if (command === 'refreshcookies') {
    if (ytMusicPlugin.cookieManager) {
      message.reply('Starting cookie refresh...');
      try {
        const freshCookies = await ytMusicPlugin.cookieManager.refreshCookies();
        if (freshCookies) {
          message.reply(`✅ Cookies refreshed successfully! Got ${freshCookies.length} cookies.`);
        } else {
          message.reply('❌ Failed to refresh cookies. Check console for errors.');
        }
      } catch (error) {
        message.reply(`❌ Error refreshing cookies: ${error.message}`);
      }
    } else {
      message.reply('Cookie manager is not enabled!');
    }
  }
  
  // Check cookie status
  if (command === 'cookiestatus') {
    if (ytMusicPlugin.cookieManager) {
      try {
        const cookies = await ytMusicPlugin.cookieManager.loadCookies(ytMusicPlugin.options.cookiesPath);
        const validation = ytMusicPlugin.cookieManager.validateCookies(cookies);
        
        message.reply([
          '**Cookie Status:**',
          `Valid: ${validation.valid ? '✅' : '❌'}`,
          `Status: ${validation.message}`,
          validation.nearestExpiry ? `Nearest Expiry: ${validation.nearestExpiry.toISOString()}` : '',
          `Total Cookies: ${cookies.length}`,
        ].filter(Boolean).join('\n'));
      } catch (error) {
        message.reply(`Error checking cookie status: ${error.message}`);
      }
    } else {
      message.reply('Cookie manager is not enabled!');
    }
  }
});

// DisTube events
distube4.on('playSong', (queue, song) => {
  queue.textChannel?.send(
    `🎵 Now playing: **${song.name}** - \`${song.formattedDuration}\``
  );
});

distube4.on('error', (channel, error) => {
  console.error('DisTube error:', error);
  channel?.send(`❌ Error: ${error.message}`);
});

distube4.on('initQueue', (queue) => {
  console.log('Queue initialized:', queue.id);
});

// Cookie refresh events (if using cookieRefresh)
if (ytMusicPlugin.cookieManager) {
  // You can add custom handlers through plugin options
  const pluginWithHandlers = new YouTubeMusicPlugin({
    cookiesPath: './cookies.json',
    cookieRefresh: {
      autoRefresh: true,
      headless: true,
      // Custom callbacks
      onCookiesUpdated: (cookies) => {
        console.log(`✅ Cookies auto-refreshed! Got ${cookies.length} fresh cookies.`);
      },
      onRefreshError: (error) => {
        console.error('❌ Cookie refresh error:', error.message);
      }
    }
  });
}

// Login
client.login('YOUR_BOT_TOKEN');

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (ytMusicPlugin.cookieManager) {
    ytMusicPlugin.destroy();
  }
  process.exit(0);
});
