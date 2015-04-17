'use strict';

describe('Locale Editor Directive', function () {
  beforeEach(function () {
    var stubs;

    module('contentful/test', function ($provide) {
      $provide.constant('locales', [
        {
          code: 'fr',
          name: 'French'
        },
        {
          code: 'de',
          name: 'German'
        }
      ]);

      stubs = $provide.makeStubs([
        'getCode',
        'getName'
      ]);
    });

    this.stubs = stubs;
    this.$q = this.$inject('$q');
    this.scope = this.$inject('$rootScope').$new();
    this.scope.spaceContext = {
      defaultLocale: {
        name: 'German',
        code: 'de'
      }
    };
    this.scope.context = {};

    this.compileElement = function() {
      this.scope.locale = {
        data: {
          code: 'co-DE'
        },
        getCode: sinon.stub().returns('co-DE'),
        getName: sinon.stub().returns('name'),
        getId: sinon.stub().returns('id'),
        isDefault: sinon.stub()
      };

      this.element = this.$inject('$compile')('<div cf-locale-editor></div>')(this.scope);
      this.scope.$digest();
    };
  });

  it('has a headline', function () {
    this.compileElement();
    this.scope.locale.getName.returns('Some language');
    this.scope.$digest();
    expect(this.element.find('.tab-header h1').html()).toMatch('Some language');
  });

  it('shows a delete button', function () {
    this.compileElement();
    expect(this.element.find('.tab-actions .delete')).not.toBeNgHidden();
  });

  it('does not show a delete button if creating a new locale', function () {
    this.compileElement();
    this.scope.locale.getId.returns();
    this.scope.$digest();
    expect(this.element.find('.tab-actions .delete')).toBeNgHidden();
  });

  it('adds and selects the opened locale in the dropdown', function () {
    this.compileElement();
    expect(this.element.find('select')[0].children.length).toBe(3);
    expect(this.element.find('select > [selected]').html()).toBe('name (co-DE)');
  });
});
