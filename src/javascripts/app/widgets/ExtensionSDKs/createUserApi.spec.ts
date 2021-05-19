import { createUserApi } from './createUserApi';
import { SpaceMember } from 'classes/spaceContextTypes';

describe('createUserApi', () => {
  const spaceMember: SpaceMember = {
    admin: false,
    roles: [{ name: 'dev', description: 'thing' }],
    sys: {
      id: 'member_id',
      type: 'SpaceMember',
      version: 1,
      createdAt: '',
      updatedAt: '',
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
