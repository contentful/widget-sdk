export const orgRoles = [
  {
    name: 'Owner',
    value: 'owner',
    description:
      'Organization owners can manage subscriptions, billing and organization memberships.'
  },
  {
    name: 'Admin',
    value: 'admin',
    description:
      'Organization admins cannot manage organization subscriptions nor billing but can manage organization memberships.'
  },
  {
    name: 'Member',
    value: 'member',
    description:
      'Organization members do not have access to any organization information and can only access assigned spaces.'
  }
];
