import _ from 'lodash';
import sinon from 'sinon';
import { $initialize, $inject } from 'test/utils/ng';
import { beforeEach, it } from 'test/utils/dsl';

describe('UserSpaceInvitationController', () => {
  beforeEach(async function() {
    this.stubs = {
      track: sinon.stub()
    };

    await this.system.set('analytics/Analytics', {
      track: this.stubs.track
    });

    await $initialize(this.system);

    const $rootScope = $inject('$rootScope');
    const $controller = $inject('$controller');

    const $timeout = $inject('$timeout');
    this.spaceContext = $inject('mocks/spaceContext').init();
    this.spaceContext.memberships.invite = sinon.stub().resolves();

    const scope = (this.scope = _.extend($rootScope.$new(), {
      users: [],
      roleOptions: [],
      selectedRoles: {},
      dialog: { confirm: sinon.stub() }
    }));

    const controller = (this.controller = $controller('UserSpaceInvitationController', {
      $scope: this.scope
    }));

    function addRole(id) {
      scope.roleOptions.push({ id: id, name: id });
    }

    function addUser(id) {
      scope.users.push({ sys: { id: id, type: 'User' }, email: `${id}@example.com` });
    }

    this.selectUserRole = (userId, roleId) => {
      scope.selectedRoles[userId] = roleId;
    };

    this.sendInvites = () => {
      const promise = controller.tryInviteSelectedUsers();
      $timeout.flush();
      return promise;
    };

    addRole('admin');
    addUser('foo');
    addUser('bar');
  });

  describe('.getInvalidRoleSelectionsCount()', () => {
    it('returns number of users without selected role', function() {
      expect(this.controller.getInvalidRoleSelectionsCount()).toEqual(2);

      this.selectUserRole('foo', 'admin');
      expect(this.controller.getInvalidRoleSelectionsCount()).toEqual(1);

      this.selectUserRole('bar', 'admin');
      expect(this.controller.getInvalidRoleSelectionsCount()).toEqual(0);

      this.selectUserRole('bar', null);
      expect(this.controller.getInvalidRoleSelectionsCount()).toEqual(1);
    });
  });

  describe('.tryInviteSelectedUsers()', () => {
    it('cannot invite when some user has no role selected', function() {
      this.controller.tryInviteSelectedUsers();
      expect(this.scope.canNotInvite).toEqual(true);
    });

    it('can invite users and sets counter correctly when all have roles selected', function() {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      this.sendInvites();
      expect(this.scope.canNotInvite).toEqual(false);
      expect(this.scope.invitationsScheduled).toEqual(2);
    });

    it('calls memberships.invite() once for every user and sets counter correctly', async function() {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      await this.sendInvites();
      sinon.assert.callCount(this.spaceContext.memberships.invite, 2);
      expect(this.scope.invitationsDone).toEqual(2);
    });

    it('closes dialog when all invitations were successful', async function() {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      await this.sendInvites();
      sinon.assert.calledOnce(this.scope.dialog.confirm);
    });

    it('sets failed invitations flag and resets counters when some invitations were not successful', async function() {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      this.spaceContext.memberships.invite.rejects();
      await this.sendInvites();
      sinon.assert.notCalled(this.scope.dialog.confirm);
      expect(this.scope.hasFailedInvitations).toEqual(true);
      expect(this.scope.invitationsScheduled).toEqual(0);
      expect(this.scope.invitationsDone).toEqual(0);
    });

    it('should track when all invitations are successful', async function() {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');

      await this.sendInvites();

      sinon.assert.calledWithExactly(this.stubs.track, 'teams_in_space:users_added', {
        numErr: 0,
        numSuccess: 2
      });
    });

    it('should track when all invitations fail', async function() {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      this.spaceContext.memberships.invite.rejects();

      await this.sendInvites();

      sinon.assert.calledWithExactly(this.stubs.track, 'teams_in_space:users_added', {
        numErr: 2,
        numSuccess: 0
      });
    });

    it('should track when some invitations fail', async function() {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');

      this.spaceContext.memberships.invite.onCall(0).resolves(true);
      this.spaceContext.memberships.invite.onCall(1).rejects();

      await this.sendInvites();

      sinon.assert.calledWithExactly(this.stubs.track, 'teams_in_space:users_added', {
        numErr: 1,
        numSuccess: 1
      });
    });
  });
});
