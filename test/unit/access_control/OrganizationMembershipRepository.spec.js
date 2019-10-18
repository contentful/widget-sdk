import { times } from 'lodash';
import sinon from 'sinon';
import { it } from 'test/utils/dsl';

describe('access_control/OrganizationMembershipRepository', () => {
  beforeEach(async function() {
    this.OrganizationMembershipRepository = await this.system.import(
      'access_control/OrganizationMembershipRepository'
    );
    this.endpoint = sinon.stub().resolves(true);
    this.makeUser = id => ({ sys: { id }, email: `${id}@foo.com` });
    this.getUsersByIds = ids =>
      this.OrganizationMembershipRepository.getUsersByIds(this.endpoint, ids);
  });

  describe('#getUsersByIds()', () => {
    it('loads users by id in batches', async function() {
      const userIds = times(100, i => `user${i}`);
      this.endpoint
        .withArgs({
          method: 'GET',
          path: ['users'],
          query: { 'sys.id': sinon.match.string }
        })
        .onFirstCall()
        .resolves({ items: userIds.slice(0, 44).map(this.makeUser) })
        .onSecondCall()
        .resolves({ items: userIds.slice(44, 88).map(this.makeUser) })
        .onThirdCall()
        .resolves({ items: userIds.slice(88).map(this.makeUser) });

      const users = await this.getUsersByIds(userIds);
      sinon.assert.calledThrice(this.endpoint);
      expect(users.length).toBe(100);
      expect(users[99].email).toBe('user99@foo.com');
    });
  });
});
