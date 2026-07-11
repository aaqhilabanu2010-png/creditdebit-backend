function resolveGoogleCallbackUrl(env = process.env) {
  if (env.GOOGLE_CALLBACK_URL) {
    return env.GOOGLE_CALLBACK_URL;
  }

  if (env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${env.RAILWAY_PUBLIC_DOMAIN}/auth/google/callback`;
  }

  return '/auth/google/callback';
}

module.exports = { resolveGoogleCallbackUrl };
