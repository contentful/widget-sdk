describe('UserSpaceInvitationController', () => {
  beforeEach(function () {
    module('contentful/test');
    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');

    const $timeout = this.$inject('$timeout');
    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.spaceContext.memberships.invite = sinon.stub().resolves();

    const scope = this.scope = _.extend($rootScope.$new(), {
      users: [],
      roleOptions: [],
      selectedRoles: {},
      dialog: { confirm: sinon.stub() }
    });

    const controller = this.controller = $controller('UserSpaceInvitationController', {
      $scope: this.scope
    });

    function addRole (id) {
      scope.roleOptions.push({ id: id, name: id });
    }

    function addUser (id) {
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
    it('returns number of users without selected role', function () {
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
    it('cannot invite when some user has no role selected', function () {
      this.controller.tryInviteSelectedUsers();
      expect(this.scope.canNotInvite).toEqual(true);
    });

    it('can invite users and sets counter correctly when all have roles selected', function () {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      this.sendInvites();
      expect(this.scope.canNotInvite).toEqual(false);
      expect(this.scope.invitationsScheduled).toEqual(2);
    });

    it('calls memberships.invite() once for every user and sets counter correctly', function* () {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      yield this.sendInvites();
      sinon.assert.callCount(this.spaceContext.memberships.invite, 2);
      expect(this.scope.invitationsDone).toEqual(2);
    });

    it('closes dialog when all invitations were successful', function* () {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      yield this.sendInvites();
      sinon.assert.calledOnce(this.scope.dialog.confirm);
    });

    it('sets failed invitations flag and resets counters when some invitations were not successful', function* () {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      this.spaceContext.memberships.invite.rejects();
      yield this.sendInvites();
      sinon.assert.notCalled(this.scope.dialog.confirm);
      expect(this.scope.hasFailedInvitations).toEqual(true);
      expect(this.scope.invitationsScheduled).toEqual(0);
      expect(this.scope.invitationsDone).toEqual(0);
    });
  });
});
