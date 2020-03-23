import * as OrganizationMembershipRepository from 'access_control/OrganizationMembershipRepository';
import { times, isEqual } from 'lodash';

describe('access_control/OrganizationMembershipRepository', () => {
  describe('#getUsersByIds()', () => {
    const endpointMock = jest.fn();
    const makeUser = id => ({ sys: { id }, email: `${id}@foo.com` });
    const getUsersByIds = ids => OrganizationMembershipRepository.getUsersByIds(endpointMock, ids);

    it('loads users by id in batches', async function() {
      const buildMockImplementation = result => ({ method, path, query }) => {
        if (method === 'GET' && isEqual(path, ['users']) && typeof query['sys.id'] === 'string') {
          return result;
        } else {
          throw new Error('Arguments to api seemed wrong');
        }
      };

      const userIds = times(100, i => `user${i}`);

      endpointMock.mockImplementationOnce(
        buildMockImplementation({ items: userIds.slice(0, 44).map(makeUser) })
      );

      endpointMock.mockImplementationOnce(
        buildMockImplementation({ items: userIds.slice(44, 88).map(makeUser) })
      );

      endpointMock.mockImplementationOnce(
        buildMockImplementation({ items: userIds.slice(88).map(makeUser) })
      );

      const users = await getUsersByIds(userIds);
      expect(endpointMock).toHaveBeenCalledTimes(3);
      expect(users).toHaveLength(100);
      expect(users[99].email).toBe('user99@foo.com');
    });
  });
});
