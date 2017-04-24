describe('UserSpaceInvitationController', function () {

  beforeEach(function () {
    module('contentful/test');
    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');

    this.$timeout = this.$inject('$timeout');
    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.spaceContext.memberships.invite = sinon.stub().resolves();

    this.scope = _.extend($rootScope.$new(), {
      users: [],
      roleOptions: [],
      selectedRoles: {},
      dialog: { confirm: sinon.stub() }
    });

    this.controller = $controller('UserSpaceInvitationController', {
      $scope: this.scope
    });

    function addRole (id) {
      this.scope.roleOptions.push({ id: id, name: id });
    }

    function addUser (id) {
      this.scope.users.push({ sys: { id: id, type: 'User' }, email: `${id}@example.com` });
    }

    this.selectUserRole = function (userId, roleId) {
      this.scope.selectedRoles[userId] = roleId;
    };

    this.sendInvites = function () {
      const promise = this.scope.tryInviteSelectedUsers();
      this.$timeout.flush();
      return promise;
    };

    addRole('admin');
    addUser('foo');
    addUser('bar');
  });

  describe('.getInvalidRoleSelectionsCount()', function () {
    it('returns number of users without selected role', function () {
      expect(this.scope.getInvalidRoleSelectionsCount()).toEqual(2);

      this.selectUserRole('foo', 'admin');
      expect(this.scope.getInvalidRoleSelectionsCount()).toEqual(1);

      this.selectUserRole('bar', 'admin');
      expect(this.scope.getInvalidRoleSelectionsCount()).toEqual(0);

      delete this.scope.selectedRoles['foo'];
      expect(this.scope.getInvalidRoleSelectionsCount()).toEqual(1);
    });
  });

  describe('.tryInviteSelectedUsers()', function () {
    it('cannot invite when some user has no role selected', function () {
      this.scope.tryInviteSelectedUsers();
      expect(this.scope.canNotInvite).toEqual(true);
    });

    it('can invite users when all have roles selected', function () {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      this.sendInvites();
      expect(this.scope.canNotInvite).toEqual(false);
    });

    it('calls memberships.invite() once for every user', function* () {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      yield this.sendInvites();
      sinon.assert.callCount(this.spaceContext.memberships.invite, 2);
    });

    it('closes dialog when all invitations were successful', function* () {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      yield this.sendInvites();
      sinon.assert.calledOnce(this.scope.dialog.confirm);
    });

    it('sets failed invitations flag when some invitations were not successful', function* () {
      this.selectUserRole('foo', 'admin');
      this.selectUserRole('bar', 'admin');
      this.spaceContext.memberships.invite.rejects();
      yield this.sendInvites();
      sinon.assert.notCalled(this.scope.dialog.confirm);
      expect(this.scope.hasFailedInvitations).toEqual(true);
    });
  });
});
