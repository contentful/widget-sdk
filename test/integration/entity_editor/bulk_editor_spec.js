import * as K from 'test/helpers/mocks/kefir';
import _ from 'lodash';

describe('bulk editor', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.removeDirectives('cfWidgetApi', 'cfWidgetRenderer');
    });

    const fakeLocaleStore = this.$inject('mocks/TheLocaleStore');
    const { registerConstant } = this.$inject('NgRegistry.es6');
    registerConstant('services/localeStore.es6', {
      default: fakeLocaleStore
    });

    const TheLocaleStore = this.$inject('services/localeStore.es6').default;
    this.setLocales = TheLocaleStore.setLocales;
    this.setLocales([{ code: 'DEF', name: 'Default' }, { code: 'EN', name: 'English' }]);

    const $q = this.$inject('$q');

    this.spaceContext = this.$inject('mocks/spaceContext').init();

    this.spaceContext.space.getEntries = query => {
      const ids = query['sys.id[in]'].split(',');
      const entities = ids.map(id => makeEntry(id, 'CTID'));
      return $q.resolve(entities);
    };

    this.spaceContext.publishedCTs.getAllBare = () => [];
    this.spaceContext.publishedCTs.fetch = id => $q.resolve(makeContentType(id));

    this.compile = function(ids = []) {
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
  });

  it('closes editor when clicking back button', function() {
    const el = this.compile();
    el.find('[data-test-id="breadcrumbs-back-btn"]').click();
    sinon.assert.calledOnce(el.referenceContext.close);
  });

  it('renders editor for each entry', function() {
    const el = this.compile(['A', 'B']);
    const entityIds = el
      .find('[data-entity-id]')
      .map((_, el) => el.getAttribute('data-entity-id'))
      .get();
    expect(entityIds).toEqual(['A', 'B']);
  });

  function makeEntry(id, ctId) {
    return {
      data: {
        sys: {
          id: id,
          type: 'Entry',
          contentType: { sys: { id: ctId } }
        }
      }
    };
  }

  function makeLink(id) {
    return {
      sys: {
        id: id,
        linkType: 'Entry',
        type: 'Link'
      }
    };
  }

  function makeContentType(id) {
    return {
      data: {
        sys: {
          id: id,
          type: 'ContentType'
        }
      }
    };
  }
});
