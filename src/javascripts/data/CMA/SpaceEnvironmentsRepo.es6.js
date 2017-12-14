import { cloneDeep } from 'lodash';
import * as Random from 'random';
import LocalStorage from 'TheStore';
import { makeCtor } from 'utils/TaggedValues';
import { sleep } from 'utils/Concurrent';

// This simulates failures in creating or updating an environment.
let hasFailed = false;

export const IdExistsError = makeCtor('IdExsistsError');
export const NameExistsError = makeCtor('NameExsistsError');
export const VersionMismatchError = makeCtor('VersionMismatchError');
export const NotFoundError = makeCtor('NotFoundError');


/**
 * Create a repository to manage space environments through the CMA.
 *
 * Currently this is a mock backed by local storage because the API is
 * not implemented yet.
 *
 * The repo offers the follwoing functions
 * - getAll()
 * - create({id, name})
 * - update(environment)
 * - remove(id)
 *
 * Since we want to see how the status changes from 'queued' to 'ready'
 * we implement some code that does that transition based on the
 * creation date of the environment.
 */
export function create (_spaceEndpoint, spaceId) {
  const store = createStore();
  return { getAll, create, remove, update };

  function getAll () {
    return sleep(200).then(() => {
      return store.getAll();
    });
  }

  function create ({id, name}) {
    return sleep(2000)
      .then(() => {
        const env = makeEnvironment(spaceId, {id, name});
        if (store.has(env)) {
          // TODO return a proper mock of the server error for this case
          throw new Error('duplicate');
        }
        if (name === 'fail' && !hasFailed) {
          hasFailed = true;
          throw new Error('Server error');
        } else {
          store.set(env);
          return env;
        }
      });
  }

  function update (env) {
    return sleep(2000)
      .then(() => {
        if (env.name === 'fail' && !hasFailed) {
          hasFailed = true;
          throw new Error('Server error');
        } else {
          store.set(env);
          return env;
        }
      });
  }

  function remove (id) {
    return sleep(500)
      .then(() => {
        if (id === 'deleteFail') {
          throw new Error('Server error');
        } else {
          store.remove(spaceId, id);
        }
      });
  }
}


/**
 * This is the actual store backing the repo.
 *
 * It stores all environments for all spaces in local storage.
 *
 * It also takes care of changing the status of an environment from
 * `queued` to `ready` if enough time has passed since the environment
 * was created.
 *
 * On every mutation changes are written to the local store.
 *
 * Items are cloned on returning so that we do not mutate them
 * inadvertantly.
 */
const localStorage = LocalStorage.forKey('mock.space-environments');
function createStore () {
  const store = new Map();
  load();

  return { get, set, has, remove, getAll };

  function remove (spaceId, id) {
    store.delete([spaceId, id].join('!'));
    write();
  }

  function set (env) {
    const key = [env.sys.space.sys.id, env.sys.id].join('!');
    store.set(key, env);
    write();
  }

  function has (env) {
    const key = [env.sys.space.sys.id, env.sys.id].join('!');
    return store.has(key);
  }

  function get (spaceId, id) {
    const env = store.get([spaceId, id].join('!'));
    moveToReady(env);
    return cloneDeep(get);
  }

  function getAll () {
    const all = Array.from(store).map(([_id, env]) => cloneDeep(env));
    all.forEach(moveToReady);
    return all;
  }

  function write () {
    localStorage.set(getAll());
  }

  function load () {
    const result = localStorage.get();
    if (Array.isArray(result)) {
      result.forEach(set);
    }
  }

  function moveToReady (env) {
    if (env.status.id === 'queued' && env.sys.createdAt + 60 * 1000 < Date.now()) {
      if (env.name === 'status-fail') {
        env.status.id = 'failed';
      } else {
        // Not sure if this is the correct value.
        env.status.id = 'ready';
      }
      set(env);
    }
  }
}


function makeEnvironment (spaceId, {id, name}) {
  id = id || Random.alnum(12);
  return {
    sys: {
      id: id,
      type: 'Environment',
      // This should be an ISO 8601 string but we use a epoch
      // milliseconds for simplicity. We use it to switch the status
      // from 'queued' after 60 seconds.
      createdAt: Date.now(),
      space: {
        sys: { id: spaceId }
      }
    },
    name: name,
    status: {
      type: 'Link',
      linkType: 'Status',
      id: 'queued'
    }
  };
}
