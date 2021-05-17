import _ from 'lodash';
import { EntityType } from '../constants';
import * as spaceContextMocked from 'ng/spaceContext';
import { when } from 'jest-when';
import fetchLinks from './fetchLinks';
import * as Navigator from 'states/Navigator';

import * as incomingLinksEvents from 'analytics/events/IncomingLinks';

const mockEntityHelper = jest.fn();

jest.mock('ng/spaceContext', () => ({
  cma: {
    getEntries: jest.fn(),
  },
  publishedCTs: {
    get: jest.fn().mockReturnValue({ name: 'CT' }),
  },
}));

jest.mock('app/entity_editor/entityHelpers', () => ({
  newForLocale: () => ({
    entityTitle: mockEntityHelper,
  }),
}));

jest.mock('states/Navigator', () => ({
  makeEntityRef: jest.fn(),
  href: jest.fn(),
}));

jest.mock('services/localeStore', () => ({
  getDefaultLocale: () => ({
    code: '',
  }),
}));

jest.mock('analytics/events/IncomingLinks', () => ({
  onFetchLinks: jest.fn(),
}));

describe('fetchLinks', () => {
  function itCallsApiAndProcessEntity(type) {
    return async function () {
      const id = 'entity-id';
      const items = [
        { sys: { id: 'entity-id-0', contentType: { sys: { id: 'ctId' } } } },
        { sys: { id: 'entity-id-1', contentType: { sys: { id: 'ctId' } } } },
        {
          sys: {
            id: 'entity-id-2',
            contentType: { sys: { id: 'ctId' } },
            environment: { sys: { id: 'dev' } },
          },
        },
        {
          sys: {
            id: 'entity-id-3',
            contentType: { sys: { id: 'ctId' } },
            environment: { sys: { id: 'master' } },
          },
        },
      ];

      when(spaceContextMocked.cma.getEntries)
        .calledWith({
          [type === EntityType.ASSET ? 'links_to_asset' : 'links_to_entry']: id,
        })
        .mockReturnValue(Promise.resolve({ items }));

      items.forEach((item, idx) => {
        when(mockEntityHelper)
          .calledWith(item)
          .mockReturnValue(Promise.resolve(`title-${idx}`));
        const ref = `ref-${idx}`;
        when(Navigator.makeEntityRef).calledWith(item).mockReturnValue(ref);
        when(Navigator.href).calledWith(ref).mockReturnValue(`href-${idx}`);
      });

      const result = await fetchLinks(id, type);

      expect(result).toEqual([
        {
          id: 'entity-id-0',
          contentTypeName: 'CT',
          title: 'title-0',
          url: 'href-0',
        },
        {
          id: 'entity-id-1',
          contentTypeName: 'CT',
          title: 'title-1',
          url: 'href-1',
        },
        {
          id: 'entity-id-2',
          contentTypeName: 'CT',
          title: 'title-2',
          url: 'href-2',
        },
        {
          id: 'entity-id-3',
          contentTypeName: 'CT',
          title: 'title-3',
          url: 'href-3',
        },
      ]);
    };
  }

  it('calls api with given id for asset', itCallsApiAndProcessEntity(EntityType.ASSET));
  it('calls api with given id for entry', itCallsApiAndProcessEntity(EntityType.ENTRY));

  it('throws if entity type neither Entry nor Asset', async function () {
    const id = 'entity-id';
    const type = 'ENTITY';

    try {
      await fetchLinks(id, type);
    } catch (e) {
      expect(e.message).toEqual('Unsupported entityType ENTITY');
      return;
    }

    throw new Error('fetchLinks is expected to throw');
  });

  it('tracks the call', async () => {
    const id = 'entity-id';
    const type = 'Entry';

    await fetchLinks(id, type);
    expect(incomingLinksEvents.onFetchLinks).toBeCalledWith({
      entityId: 'entity-id',
      entityType: 'Entry',
      incomingLinkIds: ['entity-id-0', 'entity-id-1', 'entity-id-2', 'entity-id-3'],
    });
  });
});
