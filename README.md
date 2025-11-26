# ytmusic-distube-plugin

> Unofficial YouTube Music Plugin for [DisTube](https://distube.js.org)

<div align="center">
  <a href="https://nodei.co/npm/ytmusic-distube-plugin"><img src="https://nodei.co/npm/ytmusic-distube-plugin.png?downloads=true&downloadRank=true&stars=true"></a>
</div>

## Installation

```sh
npm install ytmusic-distube-plugin
```

> **Note:** This plugin uses a fork of `@distube/ytdl-core` ([ytdl-core-stuff](https://github.com/ToddyTheNoobDud/ytdl-core-stuff)) for improved YouTube support. The dependency will be automatically installed from GitHub during installation.

## Usage

```js
const { DisTube } = require("distube");
const { YouTubeMusicPlugin } = require("ytmusic-distube-plugin");

const distube = new DisTube({
  plugins: [new YouTubeMusicPlugin()],
});
```

## Options

```js
new YouTubeMusicPlugin({
  // Whether to emit events after fetching or not (Default: true)
  emitEventsAfterFetching: true,
  // Whether to fetch the song/playlist before adding to the queue or not (Default: false)
  fetchBeforeQueued: false,
  // Whether to process playlist tracks in parallel or sequentially (Default: true)
  parallel: true,
  // Maximum number of tracks to fetch from playlists, albums, and artists (Default: 10)
  maxViews: 10,
  
  // Cookie authentication (optional)
  cookies: [...], // Array of cookies in EditThisCookie JSON format
  cookiesPath: "./cookies.json", // Or path to cookies.json file
  
  // Agent options for ytdl-core (optional)
  agentOptions: {
    pipelining: 5,
    maxRedirections: 0,
    localAddress: undefined // Bind to specific IP address
  },
  
  // Automatic cookie refresh with Puppeteer (optional)
  cookieRefresh: {
    refreshInterval: 86400000, // 24 hours in milliseconds
    refreshBeforeExpiry: 3600000, // Refresh 1 hour before expiry
    autoRefresh: true, // Enable automatic refresh
    headless: true // Run Puppeteer in headless mode
  }
});
```

## Cookie Authentication

This plugin supports YouTube cookie authentication for accessing age-restricted content, private playlists, and preventing rate limiting. Cookies can be automatically refreshed using Puppeteer to maintain persistent authentication.

### Getting Cookies

1. **Install EditThisCookie** browser extension ([Chrome](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg) / [Firefox](https://addons.mozilla.org/en-US/firefox/addon/etc2/))
2. Login to [YouTube Music](https://music.youtube.com)
3. Click the EditThisCookie icon and export cookies
4. Save as `cookies.json` in your project root

### Using Cookies (Option 1: Direct Array)

```js
const fs = require('fs');
const cookies = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));

const distube = new DisTube({
  plugins: [
    new YouTubeMusicPlugin({
      cookies: cookies
    })
  ]
});
```

### Using Cookies (Option 2: File Path)

```js
const distube = new DisTube({
  plugins: [
    new YouTubeMusicPlugin({
      cookiesPath: './cookies.json'
    })
  ]
});
```

### Automatic Cookie Refresh with Puppeteer

Keep your cookies fresh automatically without manual intervention:

```js
const distube = new DisTube({
  plugins: [
    new YouTubeMusicPlugin({
      cookiesPath: './cookies.json',
      cookieRefresh: {
        refreshInterval: 86400000, // Refresh every 24 hours
        refreshBeforeExpiry: 3600000, // Or when cookies expire in 1 hour
        autoRefresh: true, // Enable auto-refresh
        headless: false // Set to false for first-time login (shows browser)
      }
    })
  ]
});
```

**First Time Setup:**
- Set `headless: false` to see the browser window
- The plugin will open YouTube Music
- Login manually if needed
- Cookies are automatically captured and saved
- Future refreshes can use `headless: true`

**How It Works:**
- Puppeteer opens YouTube Music with existing cookies
- If cookies are expired or expiring soon, you can login manually
- Fresh cookies are automatically saved to `cookies.json`
- Agent is automatically reinitialized with new cookies
- Process repeats based on `refreshInterval`

### Cookie Refresh Options

```js
cookieRefresh: {
  // Path to save/load cookies (inherits from cookiesPath if not specified)
  cookiesPath: './cookies.json',
  
  // How often to check and refresh cookies (default: 24 hours)
  refreshInterval: 86400000,
  
  // Refresh cookies this many ms before they expire (default: 1 hour)
  refreshBeforeExpiry: 3600000,
  
  // Enable automatic refresh (default: true)
  autoRefresh: true,
  
  // Run Puppeteer in headless mode (default: true)
  // Set to false for first-time setup or when manual login is needed
  headless: true
}
```

### Manual Cookie Refresh

You can also manually trigger a cookie refresh:

```js
const plugin = new YouTubeMusicPlugin({
  cookiesPath: './cookies.json',
  cookieRefresh: { autoRefresh: false } // Disable auto-refresh
});

// Later, manually refresh
if (plugin.cookieManager) {
  await plugin.cookieManager.refreshCookies();
}
```

### Cookie Security Best Practices

⚠️ **IMPORTANT:** Cookies contain sensitive authentication data!

1. **Never commit cookies to version control:**
   ```gitignore
   # .gitignore
   cookies.json
   ```

2. **Use environment-specific cookie files:**
   ```js
   cookiesPath: process.env.COOKIE_PATH || './cookies.json'
   ```

3. **Keep 1 IP address per account** to prevent cookie invalidation

4. **Set appropriate file permissions:**
   ```bash
   chmod 600 cookies.json
   ```

5. **Rotate cookies periodically** using the auto-refresh feature

### Cookie Format

Cookies must be in **EditThisCookie JSON format**:

```json
[
  {
    "domain": ".youtube.com",
    "expirationDate": 1735689600,
    "hostOnly": false,
    "httpOnly": true,
    "name": "VISITOR_INFO1_LIVE",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "value": "your_cookie_value_here"
  }
]
```

### Troubleshooting Cookies

**Cookies not working?**
- Ensure cookies are in EditThisCookie JSON format
- Check that cookies haven't expired (`expirationDate` is in the future)
- Verify cookies are from `music.youtube.com` or `.youtube.com` domain
- Try refreshing cookies with `headless: false` to login manually

**Puppeteer errors?**
- Install Puppeteer: `npm install puppeteer`
- On Linux, install dependencies: `sudo apt-get install -y libgbm1 libasound2`
- Try running with `headless: 'new'` instead of `true`

## Supported URLs

- YouTube Music video: `https://music.youtube.com/watch?v=xxx`
- YouTube Music playlist: `https://music.youtube.com/playlist?list=xxx`
- YouTube Music album: `https://music.youtube.com/browse/MPREb_xxx`
- YouTube Music artist: `https://music.youtube.com/channel/xxx`
- YouTube video: `https://www.youtube.com/watch?v=xxx`

## Features

### Play from YouTube Music

```js
// Play YouTube Music
distube.play(voiceChannel, "https://music.youtube.com/watch?v=xxx", options);

// Play a YouTube Music playlist
distube.play(voiceChannel, "https://music.youtube.com/playlist?list=xxx", options);

// Play a YouTube Music album
distube.play(voiceChannel, "https://music.youtube.com/browse/MPREb_xxx", options);

// Play a YouTube Music artist
distube.play(voiceChannel, "https://music.youtube.com/channel/xxx", options);
```

### Search on YouTube Music

```js
const song = await distube.search("Hanya Rindu")[0];
distube.play(voiceChannel, song, options);
```

### Get Related Songs

Related songs can be automatically played when using the plugin with the DisTube's `autoplay` feature enabled. It will use this plugin to get related songs from YouTube Music.

```js
// Enable autoplay mode to use related songs
distube.toggleAutoplay(message);
```

## Testing

To run the tests:

```sh
npm test
```

## Disclaimer

This is an **unofficial** plugin for DisTube. It is not endorsed by or affiliated with DisTube or YouTube Music. This plugin is developed independently to add YouTube Music support to DisTube.

## Acknowledgements

This plugin makes use of the following libraries:
- [ytmusic-api](https://github.com/zS1L3NT/ts-npm-ytmusic-api) - API client for YouTube Music
- [ytdl-core-stuff](https://github.com/ToddyTheNoobDud/ytdl-core-stuff) - Fork of @distube/ytdl-core with enhanced YouTube support
- [DisTube](https://distube.js.org/) - A Discord.js module to simplify your music commands

## License

MIT © [abiyyufahri](https://github.com/abiyyufahri)
