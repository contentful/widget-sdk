export function memberships(orgId) {
  return {
    route: { path: 'organizations.users.list', orgId },
    options: { reload: true },
  };
}
