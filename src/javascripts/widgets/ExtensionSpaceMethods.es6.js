import { get } from 'lodash';
import * as Analytics from 'analytics/Analytics.es6';

export default async function callSpaceMethod(spaceContext, methodName, args, options = {}) {
  if (options.readOnly === true) {
    // When rendering an extension in the read-only mode we disable
    // any mutating CMA calls. This is used in snapshots right now.
    if (typeof methodName !== 'string' || !methodName.startsWith('get')) {
      throw new Error('Cannot modify data in read-only mode.');
    }
  }

  try {
    // Users are fetched with the User Cache, not the CMA client.
    if (methodName === 'getUsers') {
      const users = await spaceContext.users.getAll();
      return prepareUsers(users);
    }

    // TODO: Use `getBatchingApiClient(spaceContext.cma)`.
    const entity = await spaceContext.cma[methodName](...args);
    maybeTrackEntryAction(methodName, args, entity);
    return entity;
  } catch ({ code, body }) {
    const err = new Error('Request failed.');
    throw Object.assign(err, { code, data: body });
  }
}

function prepareUsers(users) {
  users = users || [];

  return {
    sys: { type: 'Array' },
    total: users.length,
    skip: 0,
    limit: users.length,
    items: users.map(user => ({
      sys: { type: 'User', id: user.sys.id },
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl
    }))
  };
}

function maybeTrackEntryAction(methodName, args, entity) {
  try {
    if (get(entity, ['sys', 'type']) !== 'Entry') {
      return;
    }

    if (methodName === 'createEntry') {
      trackEntryAction('create', args[0], entity);
    } else if (methodName === 'publishEntry') {
      const contentTypeId = get(args[0], ['sys', 'contentType', 'sys', 'id']);
      trackEntryAction('publish', contentTypeId, entity);
    }
  } catch (err) {
    // Just catch and ignore, failing to track should not
    // demonstrate itself outside.
  }
}

function trackEntryAction(action, contentTypeId, data) {
  Analytics.track(`entry:${action}`, {
    eventOrigin: 'ui-extension',
    // Stub content type object:
    contentType: {
      sys: { id: contentTypeId, type: 'ContentType' },
      fields: []
    },
    response: { data }
  });
}
