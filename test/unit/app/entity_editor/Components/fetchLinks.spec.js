import _ from 'lodash';
import sinon from 'sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';
import { EntityType } from 'app/entity_editor/Components/constants.es6';

describe('fetchLinks', () => {
  beforeEach(function*() {
    const system = createIsolatedSystem();

    this.spaceContext = {
      cma: {
        getEntries: sinon.stub()
      }
    };

    this.entityHelper = {
      entityTitle: sinon.stub()
    };

    this.navigator = {
      makeEntityRef: sinon.stub(),
      href: sinon.stub()
    };

    const EntityHelpers = {
      newForLocale: () => this.entityHelper
    };
    const TheLocaleStore = {
      getDefaultLocale: () => ({
        code: ''
      })
    };

    const getModuleStub = sinon.stub();
    getModuleStub
      .withArgs('spaceContext')
      .returns(this.spaceContext)
      .withArgs('EntityHelpers')
      .returns(EntityHelpers)
      .withArgs('TheLocaleStore')
      .returns(TheLocaleStore);

    system.set('NgRegistry.es6', {
      getModule: getModuleStub
    });

    system.set('states/Navigator.es6', this.navigator);

    const { default: fetchLinks } = yield system.import(
      'app/entity_editor/Components/FetchLinksToEntity/fetchLinks.es6'
    );

    this.fetchLinks = fetchLinks;
  });

  function itCallsApiAndProcessEntity(type) {
    return function*() {
      const id = 'entity-id';
      const items = [
        { sys: { id: 'entity-id-0' } },
        { sys: { id: 'entity-id-1' } },
        {
          sys: {
            id: 'entity-id-2',
            environment: { sys: { id: 'dev' } }
          }
        },
        {
          sys: {
            id: 'entity-id-3',
            environment: { sys: { id: 'master' } }
          }
        }
      ];

      this.spaceContext.cma.getEntries
        .withArgs({
          [type === EntityType.ASSET ? 'links_to_asset' : 'links_to_entry']: id
        })
        .returns(Promise.resolve({ items }));

      items.forEach((item, idx) => {
        this.entityHelper.entityTitle.withArgs(item).returns(Promise.resolve(`title-${idx}`));
        const ref = `ref-${idx}`;
        this.navigator.makeEntityRef.withArgs(item).returns(ref);
        this.navigator.href.withArgs(ref).returns(`href-${idx}`);
      });

      const result = yield this.fetchLinks(id, type);

      expect(result).toEqual([
        {
          id: 'entity-id-0',
          title: 'title-0',
          url: 'href-0'
        },
        {
          id: 'entity-id-1',
          title: 'title-1',
          url: 'href-1'
        },
        {
          id: 'entity-id-2',
          title: 'title-2',
          url: 'href-2'
        },
        {
          id: 'entity-id-3',
          title: 'title-3',
          url: 'href-3'
        }
      ]);
    };
  }

  it('calls api with given id for asset', itCallsApiAndProcessEntity(EntityType.ASSET));
  it('calls api with given id for entry', itCallsApiAndProcessEntity(EntityType.ENTRY));

  it('throws if entity type neither Entry nor Asset', function*() {
    const id = 'entity-id';
    const type = 'ENTITY';

    try {
      yield this.fetchLinks(id, type);
    } catch (e) {
      expect(e.message).toEqual('Unsupported entityType ENTITY');
      return;
    }
    throw new Error('fetchLinks is expected to throw');
  });
});
