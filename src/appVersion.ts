import packageMetadata from "../package.json";

/**
 * Runtime app version. package.json is authoritative so research exports,
 * analytics envelopes and packaged artifacts cannot silently drift apart.
 */
export const APP_VERSION = packageMetadata.version;
