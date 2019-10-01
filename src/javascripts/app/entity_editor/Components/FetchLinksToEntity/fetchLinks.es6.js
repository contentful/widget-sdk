import { makeEntityRef, href } from 'states/Navigator.es6';
import { EntityType } from '../constants.es6';
import TheLocaleStore from 'services/localeStore.es6';
import { getModule } from 'NgRegistry.es6';
import * as EntityHelpers from 'app/entity_editor/entityHelpers.es6';

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
    return Promise.all(
      items.map(entry => {
        const { id } = entry.sys;
        // Remove query params of the current URL. This prevents
        // opening slide-in editor when navigating to incoming links.
        return entityHelpers.entityTitle(entry).then(title => ({
          id,
          title,
          url: href(makeEntityRef(entry))
            .split('?')
            .shift()
        }));
      })
    );
  });
};
