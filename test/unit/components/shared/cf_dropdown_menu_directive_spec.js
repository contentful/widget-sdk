'use strict';

describe('cfDropdownMenu Directive', function () {
  var scope;

  beforeEach(function () {
    module('contentful/test');

    inject(function ($compile, $rootScope) {
      this.$rootScope = $rootScope;
      scope = $rootScope.$new();
      this.element = $compile('<div><button cf-dropdown-toggle="thisDropdownMenu"></button><div cf-dropdown-menu="thisDropdownMenu"></div></div>')(scope);
      this.dropdownMenu = this.element.find('[cf-dropdown-menu]');
      this.dropdownToggle = this.element.find('[cf-dropdown-toggle]');
    });
  });

  it('dropdown is initially hidden', function() {
    expect(this.dropdownMenu.css('display')).toBe('none');
  });

  describe('a dropdownToggle event is fired', function() {

    it('with the dropdown menu id', function() {
      this.$rootScope.$broadcast('dropdownToggle', 'thisDropdownMenu', this.dropdownToggle);
      expect(this.dropdownMenu.css('display')).toBe('block');
    });

    it('with a different dropdown menu id', function() {
      this.$rootScope.$broadcast('dropdownToggle', 'anotherDropdownMenu', this.dropdownToggle);
      expect(this.dropdownMenu.css('display')).toBe('none');
    });

    it('with the dropdown menu id but a different toggle', function() {
      this.$rootScope.$broadcast('dropdownToggle', 'thisDropdownMenu', $('<button></button>'));
      expect(this.dropdownMenu.css('display')).toBe('none');
    });

  });


});
