const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveGoogleCallbackUrl } = require('../config/googleAuth');

test('uses the explicit Google callback URL when provided', () => {
  const callbackUrl = resolveGoogleCallbackUrl({
    GOOGLE_CALLBACK_URL: 'https://example.com/auth/google/callback',
  });

  assert.equal(callbackUrl, 'https://example.com/auth/google/callback');
});

test('builds an HTTPS Railway callback URL from the public domain', () => {
  const callbackUrl = resolveGoogleCallbackUrl({
    RAILWAY_PUBLIC_DOMAIN: 'creditdebit-backend-production-abd7.up.railway.app',
  });

  assert.equal(
    callbackUrl,
    'https://creditdebit-backend-production-abd7.up.railway.app/auth/google/callback'
  );
});

test('falls back to a relative callback URL when no production URL is available', () => {
  const callbackUrl = resolveGoogleCallbackUrl({});

  assert.equal(callbackUrl, '/auth/google/callback');
});
