'use strict';

describe('SpaceHomeController', function() {
  let scope, spaceHomeController;
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.value('Config', { supportUrl: 'supportUrl' });
    });
    scope = this.$inject('$rootScope').$new();
    scope.context = {};
    this.accessChecker = this.$inject('access_control/AccessChecker');
    this.OrganizationRoles = this.$inject('services/OrganizationRoles.es6');
    spaceHomeController = this.$inject('states/SpaceHomeController.es6').spaceHomeController[2];

    this.getSpace = function({ isAdmin, isAuthor, isEditor }) {
      return {
        sys: { id: 'id' },
        readOnlyAt: undefined,
        name: 'spaceName',
        organization: { name: 'organizationName' },
        spaceMembership: {
          admin: isAdmin,
          roles: [isAuthor ? { name: 'Author' } : {}, isEditor ? { name: 'Editor' } : {}]
        }
      };
    };
  });
  it('should return "isSpaceAdmin = true" if user is admin', function() {
    const space = this.getSpace({ isAdmin: true, isAuthor: false, isEditor: false });
    spaceHomeController(scope, space);
    expect(scope.isSpaceAdmin).toBe(true);
    expect(scope.isAuthorOrEditor).toBe(false);
  });
  it('should return "isAuthorOrEditor = true" if user is author', function() {
    const space = this.getSpace({ isAdmin: false, isAuthor: true, isEditor: false });
    spaceHomeController(scope, space);
    expect(scope.isSpaceAdmin).toBe(false);
    expect(scope.isAuthorOrEditor).toBe(true);
  });
  it('should return "isAuthorOrEditor = true" if user is editor', function() {
    const space = this.getSpace({ isAdmin: false, isAuthor: false, isEditor: true });
    spaceHomeController(scope, space);
    expect(scope.isSpaceAdmin).toBe(false);
    expect(scope.isAuthorOrEditor).toBe(true);
  });
  it('should return "isAuthorOrEditor = true" if user is author and editor', function() {
    const space = this.getSpace({ isAdmin: false, isAuthor: true, isEditor: true });
    spaceHomeController(scope, space);
    expect(scope.isSpaceAdmin).toBe(false);
    expect(scope.isAuthorOrEditor).toBe(true);
  });
});
