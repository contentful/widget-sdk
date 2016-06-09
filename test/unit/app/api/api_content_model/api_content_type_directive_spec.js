'use strict';

describe('apiContentType Directive', function () {
  beforeEach(function () {
    module('contentful/test');

    this.element = this.$compile('<cf-api-content-type />');
    this.scope = this.element.scope();
  });

  it('toggles content type field visibility', function () {
    expect(this.scope.isExpanded).toBe(false);
    this.scope.toggleFields();
    expect(this.scope.isExpanded).toBe(true);
  });

  it('renders help text', function () {
    expect(this.scope.getHelpText('Symbol')).toContain('Maximum length is 256');
  });
});
