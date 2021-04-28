export function memberships(orgId) {
  return {
    path: ['account', 'organizations', 'users', 'list'],
    params: { orgId },
    options: { reload: true },
  };
}
