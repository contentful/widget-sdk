export function home(spaceId) {
  return {
    path: ['spaces', 'detail', 'home'],
    params: { spaceId },
    options: { reload: true }
  };
}

export function usage(spaceId) {
  return {
    path: ['spaces', 'detail', 'settings', 'usage'],
    params: { spaceId },
    options: { reload: true }
  };
}
