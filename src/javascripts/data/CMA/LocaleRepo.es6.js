import {omit} from 'lodash';
import {fetchAll} from './FetchAll';

export default function create (spaceEndpoint) {
  return {
    getAll,
    save,
    remove
  };

  function getAll () {
    return fetchAll(spaceEndpoint, ['locales'], 100);
  }

  function save (locale) {
    const sys = locale.sys;
    const isNew = !sys || !sys.id;

    const method = isNew ? 'POST' : 'PUT';
    const path = ['locales'].concat(isNew ? [] : [sys.id]);
    const data = omit(locale, ['sys', 'default', 'internal_code']);
    const version = isNew ? undefined : sys.version;

    return spaceEndpoint({method, path, data, version});
  }

  function remove (id, version) {
    return spaceEndpoint({
      method: 'DELETE',
      path: ['locales', id],
      version
    });
  }
}
