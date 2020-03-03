import { makeEntityRef, href } from 'states/Navigator';
import { EntityType } from '../constants';
import TheLocaleStore from 'services/localeStore';
import { getModule } from 'NgRegistry';
import * as EntityHelpers from 'app/entity_editor/entityHelpers';
import { onFetchLinks } from 'analytics/events/IncomingLinks';

const assertEntityTypeIsValid = entityType => {
  if (entityType !== EntityType.ENTRY && entityType !== EntityType.ASSET) {
    throw new Error(`Unsupported entityType ${entityType}`);
  }
};

export default (id, type) => {
  const spaceContext = getModule('spaceContext');

  const defaultLocaleCode = TheLocaleStore.getDefaultLocale().code;
  const entityHelpers = EntityHelpers.newForLocale(defaultLocaleCode);

  assertEntityTypeIsValid(type);
  const payloadKey = type === EntityType.ENTRY ? 'links_to_entry' : 'links_to_asset';
  const payload = {
    [payloadKey]: id
  };

  return spaceContext.cma.getEntries(payload).then(({ items }) => {
    onFetchLinks({
      entityId: id,
      entityType: type,
      incomingLinksCount: items.length
    });

    return Promise.all(
      items.map(entry => {
        const { id } = entry.sys;
        const contentType = spaceContext.publishedCTs.get(entry.sys.contentType.sys.id);
        // Remove query params of the current URL. This prevents
        // opening slide-in editor when navigating to incoming links.
        return entityHelpers.entityTitle(entry).then(title => ({
          id,
          title,
          contentTypeName: contentType.data.name,
          url: href(makeEntityRef(entry))
            .split('?')
            .shift()
        }));
      })
    );
  });
};
