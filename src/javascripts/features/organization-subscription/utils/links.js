export function memberships(orgId) {
  return {
    path: ['account', 'organizations', 'users', 'list'],
    params: { orgId },
    options: { reload: true },
  };
}

export function invoices(orgId) {
  return {
    path: ['account', 'organizations', 'billing'],
    params: { orgId },
    options: { reload: true },
  };
}
