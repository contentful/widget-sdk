describe('bulk editor', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
      $provide.removeDirectives('cfWidgetApi', 'cfWidgetRenderer');
    });

    const TheLocaleStore = this.$inject('TheLocaleStore');
    this.setLocales = TheLocaleStore.setLocales;
    this.setLocales([
      {code: 'DEF', name: 'Default'},
      {code: 'EN', name: 'English'}
    ]);

    const K = this.$inject('mocks/kefir');
    const $q = this.$inject('$q');

    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.spaceContext.space.getEntry = function (id) {
      return $q.resolve({
        data: {
          sys: {
            id: id,
            type: 'Entry',
            contentType: {sys: {id: 'CTID'}}
          }
        }
      });
    };

    this.spaceContext.publishedCTs.fetch = function (id) {
      return $q.resolve({
        data: {
          sys: {
            id: id,
            type: 'ContentType'
          }
        }
      });
    };

    this.compile = function (ids = []) {
      const referenceContext = {
        links$: K.createMockProperty(ids.map(makeLink)),
        close: sinon.spy()
      };
      const el = this.$compile('<cf-bulk-editor reference-context="referenceContext">', {
        referenceContext
      });
      el.referenceContext = referenceContext;
      this.$apply();
      return el;
    };

    function makeLink (id) {
      return {
        sys: {
          id: id,
          linkType: 'Entry',
          type: 'Link'
        }
      };
    }
  });

  it('closes editor when clicking back button', function () {
    const el = this.compile();
    el.find('[data-test-id="breadcrumbs-back-btn"]').click();
    sinon.assert.calledOnce(el.referenceContext.close);
  });

  it('renders editor for each entry', function () {
    const el = this.compile(['A', 'B']);
    const entityIds =
      el.find('[data-entity-id]')
      .map((_, el) => el.getAttribute('data-entity-id'))
      .get();
    expect(entityIds).toEqual(['A', 'B']);
  });
});
