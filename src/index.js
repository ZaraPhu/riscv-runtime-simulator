export default {
  async fetch(request, env, ctx) {
    // This will automatically use files from your site assets (public directory)
    return env.ASSETS.fetch(request);
  }
};