'use strict';

describe('cfAccountProfileNav directive', function () {
  beforeEach(function () {
    module('contentful/test');
    this.$state = this.$inject('$state');
    this.compile = function () {
      this.element = this.$compile('<cf-account-profile-nav />');
    };
  });

  it('selects the correct tab based on the current state', function () {
    const states = [
      {stateName: 'account.profile.applications', text: 'Applications'},
      {stateName: 'account.profile.space_memberships', text: 'Spaces'}
    ];

    states.forEach((state) => {
      this.$state.current.name = state.stateName;
      this.compile();
      const selectedTab = this.element.find('a[aria-selected="true"]');
      expect(selectedTab.text()).toBe(state.text);
    });

  });
});
