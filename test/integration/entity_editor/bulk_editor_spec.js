import sinon from 'sinon';
import * as K from 'test/utils/kefir';
import createLocaleStoreMock from 'test/utils/createLocaleStoreMock';
import _ from 'lodash';
import { $initialize, $inject, $apply, $compile } from 'test/utils/ng';

describe('bulk editor', () => {
  beforeEach(async function () {
    // module('contentful/test', $provide => {
    //   $provide.removeDirectives('cfWidgetApi', 'cfWidgetRenderer');
    // });

    const localeStore = {
      default: createLocaleStoreMock(),
    };

    this.system.set('services/localeStore', localeStore);

    localeStore.default.setLocales([
      { code: 'DEF', name: 'Default' },
      { code: 'EN', name: 'English' },
    ]);

    await $initialize(this.system);

    const $q = $inject('$q');

    this.spaceContext = $inject('mocks/spaceContext').init();

    this.spaceContext.space.getEntries = (query) => {
      const ids = query['sys.id[in]'].split(',');
      const entities = ids.map((id) => makeEntry(id, 'CTID'));
      return $q.resolve(entities);
    };

    this.spaceContext.publishedCTs.getAllBare = () => [];
    this.spaceContext.publishedCTs.fetch = (id) => $q.resolve(makeContentType(id));

    this.compile = function (ids = []) {
      const referenceContext = {
        links$: K.createMockProperty(ids.map(makeLink)),
        close: sinon.spy(),
      };
      const el = $compile('<cf-bulk-editor reference-context="referenceContext">', {
        referenceContext,
      });
      el.referenceContext = referenceContext;
      $apply();
      return el;
    };
  });

  it('closes editor when clicking back button', function () {
    const el = this.compile();
    el.find('[data-test-id="breadcrumbs-back-btn"]').click();
    sinon.assert.calledOnce(el.referenceContext.close);
  });

  xit('renders editor for each entry', function () {
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
          contentType: { sys: { id: ctId } },
        },
      },
    };
  }

  function makeLink(id) {
    return {
      sys: {
        id: id,
        linkType: 'Entry',
        type: 'Link',
      },
    };
  }

  function makeContentType(id) {
    return {
      data: {
        sys: {
          id: id,
          type: 'ContentType',
        },
      },
    };
  }
});
