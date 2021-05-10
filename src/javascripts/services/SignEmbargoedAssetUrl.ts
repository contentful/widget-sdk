// In the interest of keeping things lightweight, we implement our own
// jwt signing rather than importing a bunch of libs.
import * as b64 from 'js-base64';

const JWT_HEADER_BASE64 = b64.encodeURI(
  JSON.stringify({
    alg: 'HS256',
    typ: 'JWT',
  })
);

/**
 * Converts a US-ASCII-compatible string into a Uint8Array. If the string
 * you provide is not US-ASCII compatible, the results cannot be depended upon.
 *
 * base64(-uri) encoded strings are US-ASCII-compatible.
 **/
function asciiStringToUint8Array(asciiStr: string) {
  return Uint8Array.from(asciiStr, (c) => c.charCodeAt(0));
}

export async function importAsciiStringAsHS256Key(asciiStr: string) {
  return await window.crypto.subtle.importKey(
    'raw',
    asciiStringToUint8Array(asciiStr),
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );
}

async function signJwtHS256(cryptoKey: CryptoKey, payload: object): Promise<string> {
  const payloadBase64 = b64.encodeURI(JSON.stringify(payload));
  const headerAndPayloadBase64 = `${JWT_HEADER_BASE64}.${payloadBase64}`;

  const uint8Arr = asciiStringToUint8Array(headerAndPayloadBase64);

  const sig = await window.crypto.subtle.sign('HMAC', cryptoKey, uint8Arr);
  const sigBase64 = b64.fromUint8Array(new Uint8Array(sig), true); // true: uri-safe

  return `${headerAndPayloadBase64}.${sigBase64}`;
}

async function generateSignedToken(
  cryptoKey: CryptoKey,
  urlWithoutQueryParams: string,
  expiresAtMs?: number
): Promise<string> {
  const exp = expiresAtMs ? Math.floor(expiresAtMs / 1000) : undefined;
  return await signJwtHS256(cryptoKey, {
    sub: urlWithoutQueryParams,
    exp,
  });
}

export async function generateSignedAssetUrl(
  cryptoKey: CryptoKey,
  policy: string,
  url: string,
  expiresAtMs?: number
): Promise<string> {
  const parsedUrl = new URL(url);

  const urlWithoutQueryParams = parsedUrl.origin + parsedUrl.pathname;
  const token = await generateSignedToken(cryptoKey, urlWithoutQueryParams, expiresAtMs);

  parsedUrl.searchParams.set('token', token);
  parsedUrl.searchParams.set('policy', policy);

  return parsedUrl.toString();
}
