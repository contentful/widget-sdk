export function getEndpoint(url) {
  const segments = url
    .split('?')[0]
    .split('/')
    .slice(3);
  const makeStableName = idx => `/${segments[idx]}${segments[idx + 1] ? '/:id' : ''}`;

  if (segments.length <= 2) {
    return `/${segments.join('/')}`;
  }

  if (segments[2] === 'environments' && segments.length > 3) {
    return makeStableName(4);
  } else {
    return makeStableName(2);
  }
}
