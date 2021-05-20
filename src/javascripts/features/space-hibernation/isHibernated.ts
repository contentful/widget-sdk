export function isHibernated(space) {
  return (space.enforcements || []).some((e) => e.reason === 'hibernated');
}
