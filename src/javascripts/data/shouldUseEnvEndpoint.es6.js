// List of path prefixes that should be used with
// environment endpoints if in the environment context.
// Useful: https://gist.github.com/benben/69099d38b31f276434b0b5eb78a9eda3
const PREFIXES = [
  'public',
  'content_types',
  'entries',
  'assets',
  'ui_config',
  'extensions',
  'locales'
];

// Given a path return `true` if the environment endpoint
// should be used. Return `false` otherwise.
export default function(path) {
  if (typeof path === 'string') {
    path = path.split('/');
  }

  if (!Array.isArray(path)) {
    throw new Error('Endpoint path has to be a string or an array');
  }

  // Make sure all path segments are joined with one slash
  // and there are no slashes at the beginning and the end.
  path = path
    .join('/')
    .split('/')
    .filter(x => x)
    .join('/');

  return PREFIXES.some(prefix => path.indexOf(prefix) === 0);
}
