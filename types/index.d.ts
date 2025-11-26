import { type DisTube, ExtractorPlugin, type Song, type Playlist } from "distube"
import { type Agent as YtdlAgent } from "@distube/ytdl-core"

/**
 * Cookie object in EditThisCookie JSON format
 */
declare interface Cookie {
  /**
   * Cookie name
   */
  name: string
  /**
   * Cookie value
   */
  value: string
  /**
   * Cookie domain (e.g., ".youtube.com")
   */
  domain?: string
  /**
   * Cookie path
   * @default "/"
   */
  path?: string
  /**
   * Whether the cookie is secure (HTTPS only)
   */
  secure?: boolean
  /**
   * Whether the cookie is HTTP only
   */
  httpOnly?: boolean
  /**
   * Cookie expiration date (Unix timestamp in seconds)
   */
  expirationDate?: number
  /**
   * SameSite policy
   */
  sameSite?: 'strict' | 'lax' | 'no_restriction' | 'unspecified'
  /**
   * Whether the cookie is host-only
   */
  hostOnly?: boolean
  /**
   * Whether the cookie is a session cookie
   */
  session?: boolean
}

/**
 * Undici agent options for ytdl-core
 */
declare interface AgentOptions {
  /**
   * Number of concurrent requests per origin
   * @default 1
   */
  pipelining?: number
  /**
   * Maximum number of redirections to follow
   * @default 0
   */
  maxRedirections?: number
  /**
   * Local address to bind to
   */
  localAddress?: string
  /**
   * Additional undici agent options
   */
  [key: string]: any
}

/**
 * Cookie refresh options for automatic cookie management
 */
declare interface CookieRefreshOptions {
  /**
   * Path to cookies.json file
   */
  cookiesPath?: string
  /**
   * Refresh interval in milliseconds
   * @default 86400000 (24 hours)
   */
  refreshInterval?: number
  /**
   * Refresh cookies this many milliseconds before expiry
   * @default 3600000 (1 hour)
   */
  refreshBeforeExpiry?: number
  /**
   * Enable automatic cookie refresh
   * @default true
   */
  autoRefresh?: boolean
  /**
   * Run Puppeteer in headless mode
   * @default true
   */
  headless?: boolean
}

declare interface YouTubeMusicPluginOptions {
  /**
   * Whether to emit events after fetching or not
   * @default true
   */
  emitEventsAfterFetching?: boolean
  /**
   * Whether to fetch the song/playlist before adding to the queue or not
   * @default false
   */
  fetchBeforeQueued?: boolean
  /**
   * Whether to process playlist tracks in parallel or sequentially
   * @default true
   */
  parallel?: boolean
  /**
   * Maximum number of tracks to fetch from playlists, albums, and artists
   * @default 10
   */
  maxViews?: number
  /**
   * Cookie array in EditThisCookie JSON format for authentication
   */
  cookies?: Cookie[]
  /**
   * Path to cookies.json file
   */
  cookiesPath?: string
  /**
   * Undici agent options for ytdl-core
   */
  agentOptions?: AgentOptions
  /**
   * Enable automatic cookie refresh with Puppeteer
   * Set to `true` for default options or provide custom options
   */
  cookieRefresh?: boolean | CookieRefreshOptions
}

declare interface SearchSongsOptions {
  /**
   * Type of search result
   * @default 'song'
   */
  type?: 'song' | 'album' | 'playlist' | 'artist'
  /**
   * Maximum number of results to return
   * @default 3
   */
  limit?: number
  /**
   * Discord guild member who performed the search
   */
  member?: any
  /**
   * Additional metadata to associate with the songs
   */
  metadata?: any
}

declare class YouTubeMusicPlugin extends ExtractorPlugin {
  constructor(options?: YouTubeMusicPluginOptions)

  /**
   * Plugin options
   */
  options: YouTubeMusicPluginOptions

  /**
   * DisTube instance
   */
  distube: DisTube

  /**
   * YouTube Music API instance
   */
  ytmusic: any

  /**
   * ytdl-core agent with cookies (if configured)
   */
  agent: YtdlAgent | null

  /**
   * Cookie manager for auto-refresh (if enabled)
   */
  cookieManager: any | null

  /**
   * Initialize the plugin
   * @param distube DisTube instance
   */
  init(distube: DisTube): Promise<void>

  /**
   * Plugin name
   */
  get name(): string

  /**
   * Check if the URL is supported by this plugin
   * @param url URL to check
   */
  validate(url: string): boolean

  /**
   * Resolve the validated URL to a Song or a Playlist
   * @param url URL to resolve
   * @param options Optional options
   */
  resolve(url: string, options?: any): Promise<Song | Playlist>

  /**
   * Search for a Song which is playable from this plugin's source
   * @param query Search query
   * @param options Optional options
   */
  searchSong(query: string, options?: any): Promise<Song | null>

  /**
   * Search for multiple Songs from YouTube Music
   * @param query Search query
   * @param options Optional search options
   */
  searchSongs(query: string, options?: SearchSongsOptions): Promise<Song[]>

  /**
   * Get the stream URL from Song's URL
   * @param song Input song
   */
  getStreamURL(song: Song): Promise<string>

  /**
   * Get related songs
   * @param song Input song
   */
  getRelatedSongs(song: Song): Promise<Song[]>

  /**
   * Cleanup and stop cookie auto-refresh
   */
  destroy(): void

  /**
   * Extract ID from YouTube Music URLs
   * @param url URL to extract ID from
   * @private
   */
  private extractId(url: string): { type: string; id: string | null }

  /**
   * Initialize cookie manager with auto-refresh
   * @private
   */
  private initializeCookieManager(): void

  /**
   * Initialize ytdl agent with cookies
   * @private
   */
  private initializeAgent(): Promise<void>

  /**
   * Process playlist tracks to Song objects
   * @param tracks Tracks to process
   * @param options Options
   * @private
   */
  private processPlaylistTracks(tracks: any[], options: any): Promise<Song[]>

  /**
   * Convert duration string (MM:SS) to seconds
   * @param duration Duration string
   * @private
   */
  private convertDurationToSeconds(duration: string): number
}

export default YouTubeMusicPlugin
