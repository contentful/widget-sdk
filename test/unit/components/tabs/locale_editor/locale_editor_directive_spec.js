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

    const spaceContext = this.$inject('spaceContext');
    spaceContext.space = {};
    dotty.put(spaceContext, 'space.data.organization.subscriptionPlan.name');

    this.locale = locale('co-DE');

    this.element = this.$compile('<cf-locale-editor>', {
      spaceLocales: [locale('fr'), locale('de'), locale('co-DE')],
      locale: this.locale,
      context: {}
    });

    this.scope = this.element.scope();
  });

  function locale (code) {
    const id = 'id-for-' + code;
    return {
      data: {
        sys: {id: id},
        default: false,
        name: 'name for ' + code,
        code: code,
        contentDeliveryApi: true
      },
      getId: sinon.stub().returns(id)
    };
  }

  it('has a headline based on locale code', function () {
    this.scope.locale.data.code = 'de';
    this.$apply();
    expect(this.element.find('.workbench-header h1').text()).toMatch('German');
  });

  it('shows a delete button', function () {
    expect(this.element.find('.workbench-actions .delete')).not.toBeNgHidden();
  });

  it('renders the dropdown with locales', function () {
    expect(this.element.find('select:eq(0)').children().length).toBe(4);
  });

  it('selects the opened locale in the dropdown', function () {
    expect(this.element.find('select:eq(0) > :selected').text()).toBe('name for co-DE (co-DE)');
  });

  it('renders list of available fallbacks', function () {
    const children = this.element.find('select:eq(1)').children();
    expect(children.length).toBe(3);
    expect(children.toArray().map((e) => { return e.textContent; })).toEqual([
      'None (no fallback)', 'name for fr (fr)', 'name for de (de)'
    ]);
  });

  it('hides fallbacks if locale is the default one', function () {
    this.locale.data.default = true;
    this.$apply();
    expect(this.element.find('select').length).toBe(1);
  });
});
