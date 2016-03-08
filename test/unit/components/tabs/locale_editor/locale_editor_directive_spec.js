'use strict';

describe('Locale Editor Directive', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.constant('localesList', [
        {
          code: 'fr',
          name: 'French'
        },
        {
          code: 'de',
          name: 'German'
        }
      ]);
    });

    var spaceContext = this.$inject('spaceContext');
    spaceContext.space = {};
    dotty.put(spaceContext, 'space.data.organization.subscriptionPlan.name');

    this.element = this.$compile('<cf-locale-editor>', {
      locale: {
        data: {
          code: 'co-DE'
        },
        getCode: sinon.stub().returns('co-DE'),
        getName: sinon.stub().returns('name'),
        getId: sinon.stub().returns('id'),
        getVersion: sinon.stub()
      },
      context: {},
      spaceContext: spaceContext
    });

    this.scope = this.element.scope();
  });

  it('has a headline', function () {
    this.scope.locale.getName.returns('Some locale');
    this.$apply();
    expect(this.element.find('.workbench-header h1').text()).toMatch('Some locale');
  });

  it('shows a delete button', function () {
    expect(this.element.find('.workbench-actions .delete')).not.toBeNgHidden();
  });

  it('renders the dropdown with locales', function () {
    expect(this.element.find('select').get(0).children.length).toBe(4);
  });

  it('selects the opened locale in the dropdown', function () {
    expect(this.element.find('select > :selected').text()).toBe('name (co-DE)');
  });
});
