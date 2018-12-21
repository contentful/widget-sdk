'use strict';

describe('HomeTemplate', () => {
  beforeEach(function() {
    module('contentful/test');
    this.$state = this.$inject('$state');
    this.$state.current = { name: 'home' };

    this.accessChecker = this.$inject('access_control/AccessChecker');
    this.spaceHomeController = this.$inject('states/SpaceHomeController.es6').spaceHomeController;
  });
  it('displays widget container if author or editor', function() {
    const template = this.$inject('app/home/HomeTemplate.es6').default();
    const $compile = this.$inject('$compile');
    const $rootScope = this.$inject('$rootScope');
    const scope = $rootScope.$new();
    scope.context = { ready: true, forbidden: false };
    scope.readOnlySpace = false;
    scope.isAuthorOrEditor = true;
    scope.isSpaceAdmin = false;
    this.element = $compile(template)(scope);
    this.$apply();
    expect(this.element.has('.home__container').length).toBe(0);
    expect(this.element.has('.widget-container').length).toBe(1);
  });
  it('displays home container if admin', function() {
    const template = this.$inject('app/home/HomeTemplate.es6').default();
    const $compile = this.$inject('$compile');
    const $rootScope = this.$inject('$rootScope');
    const scope = $rootScope.$new();
    scope.context = { ready: true, forbidden: false };
    scope.readOnlySpace = false;
    scope.isAuthorOrEditor = false;
    scope.isSpaceAdmin = true;
    this.element = $compile(template)(scope);
    this.$apply();
    expect(this.element.has('.home__container').length).toBe(1);
    expect(this.element.has('.widget-container').length).toBe(0);
  });
});
