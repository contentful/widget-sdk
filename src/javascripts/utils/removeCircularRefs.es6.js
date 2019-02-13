import stringifySafe from 'json-stringify-safe';

export default function removeCircularRefs(obj) {
  return JSON.parse(stringifySafe(obj));
}
