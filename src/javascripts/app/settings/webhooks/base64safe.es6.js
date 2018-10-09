// We have to sanitize input to `btoa` to avoid "Character Out Of Range" exceptions.
// See: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem
export default function base64safe(input) {
  return btoa(input.replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));
}
