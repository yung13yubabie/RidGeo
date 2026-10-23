declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}

// Vite serves these imports as strings; this declaration has no runtime effect.
declare module "*?raw" {
  const content: string;
  export default content;
}
