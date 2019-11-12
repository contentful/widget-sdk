import _ from 'lodash';
import sinon from 'sinon';
import { EntityType } from 'app/entity_editor/Components/constants';
import { beforeEach, it } from 'test/utils/dsl';

describe('fetchLinks', () => {
  beforeEach(async function() {
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
    getModuleStub.withArgs('spaceContext').returns(this.spaceContext);

    this.system.set('NgRegistry', {
      getModule: getModuleStub
    });

    this.system.set('app/entity_editor/entityHelpers', EntityHelpers);

    this.system.set('services/localeStore', {
      default: TheLocaleStore
    });

    this.system.set('states/Navigator', this.navigator);

    const { default: fetchLinks } = await this.system.import(
      'app/entity_editor/Components/FetchLinksToEntity/fetchLinks'
    );

    this.fetchLinks = fetchLinks;
  });

  function itCallsApiAndProcessEntity(type) {
    return async function() {
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

      const result = await this.fetchLinks(id, type);

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

  it('throws if entity type neither Entry nor Asset', async function() {
    const id = 'entity-id';
    const type = 'ENTITY';

    try {
      await this.fetchLinks(id, type);
    } catch (e) {
      expect(e.message).toEqual('Unsupported entityType ENTITY');
      return;
    }

    throw new Error('fetchLinks is expected to throw');
  });
});
