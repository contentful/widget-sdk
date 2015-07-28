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

    this.$q = this.$inject('$q');
    this.scope = this.$inject('$rootScope').$new();
    this.scope.spaceContext = {
      defaultLocale: {
        name: 'German',
        code: 'de'
      }
    };

    dotty.put(this.scope.spaceContext, 'space.data.organization.subscriptionPlan.name');
    this.scope.context = {};

    this.compileElement = function() {
      this.scope.locale = {
        data: {
          code: 'co-DE'
        },
        getCode: sinon.stub().returns('co-DE'),
        getName: sinon.stub().returns('name'),
        getId: sinon.stub().returns('id'),
        isDefault: sinon.stub(),
        save: sinon.stub(),
        delete: sinon.stub(),
        getVersion: sinon.stub()
      };

      this.element = this.$inject('$compile')('<div cf-locale-editor></div>')(this.scope);
      this.scope.$digest();
    };
  });

  it('has a headline', function () {
    this.compileElement();
    this.scope.locale.getName.returns('Some locale');
    this.scope.$digest();
    expect(this.element.find('.workbench-header h1').text()).toMatch('Some locale');
  });

  it('shows a delete button', function () {
    this.compileElement();
    expect(this.element.find('.tab-actions .delete')).not.toBeNgHidden();
  });

  it('does not show a delete button if creating a new locale', function () {
    this.compileElement();
    this.scope.locale.getId.returns();
    this.scope.$digest();
    expect(this.element.find('.workbench-actions .delete')).toBeNgHidden();
  });

  it('renders the dropdown with locales', function () {
    this.compileElement();
    expect(this.element.find('select').get(0).children.length).toBe(4);
  });


  it('selects the opened locale in the dropdown', function () {
    this.compileElement();
    expect(this.element.find('select > :selected').text()).toBe('name (co-DE)');
  });
});
