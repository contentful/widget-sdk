import { createUserApi, SpaceMember } from './createUserApi';

describe('createUserApi', () => {
  const spaceMember: SpaceMember = {
    admin: false,
    roles: [{ name: 'dev', description: 'thing' }],
    sys: {
      id: 'member_id',
      user: {
        sys: {
          id: 'user_id',
        },
        firstName: 'bob',
        lastName: 'cratchit',
        email: 'bob@bob.com',
        avatarUrl: 'www.example.com',
      },
    },
  };

  it('formats the spacemember correctly', () => {
    const userApi = createUserApi(spaceMember);
    expect(userApi).toMatchSnapshot();
  });
});
