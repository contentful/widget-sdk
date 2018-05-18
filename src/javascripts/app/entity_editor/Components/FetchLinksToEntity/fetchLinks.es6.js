import spaceContext from 'spaceContext';
import EntityHelpers from 'EntityHelpers';
import TheLocaleStore from 'TheLocaleStore';
import { makeEntityRef, href } from 'states/Navigator';
import { EntityType } from '../constants';
import { get } from 'lodash';

const defaultLocaleCode = TheLocaleStore.getDefaultLocale().code;
const entityHelpers = EntityHelpers.newForLocale(defaultLocaleCode);

const assertEntityTypeIsValid = entityType => {
  if (entityType !== EntityType.ENTRY && entityType !== EntityType.ASSET) {
    throw new Error(`Unsupported entityType ${entityType}`);
  }
};

export default (id, type) => {
  assertEntityTypeIsValid(type);
  const payloadKey =
    type === EntityType.ENTRY ? 'links_to_entry' : 'links_to_asset';
  const payload = {
    [payloadKey]: id
  };

  return spaceContext.cma.getEntries(payload).then(({ items }) => {
    return Promise.all(
      items.map(entry => {
        const { id } = entry.sys;
        // make sure the url points to the corrent space env.
        // falls back to master if no env id is found
        const env = get(entry, 'sys.environment.sys.id', 'master');
        return entityHelpers.entityTitle(entry).then(title => ({
          id,
          title,
          url: href(makeEntityRef(entry, env))
        }));
      })
    );
  });
};
