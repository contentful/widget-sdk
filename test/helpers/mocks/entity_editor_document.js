import * as sinon from 'helpers/sinon';
import * as K from 'test/helpers/mocks/kefir';
import $q from '$q';
import { create as createResourceState } from 'data/document/ResourceStateManager';

/**
 * @ngdoc service
 * @module contentful/mocks
 * @name mocks/entityEditor/Document
 * @description
 * Create a mock implementation of `app/entity_editor/Document`.
 *
 * TODO at some point we should mock this by using the correct
 * implementation with just the ShareJS Doc mock
 */

export function create(initialData, spaceEndpoint) {
  let currentData;
  const data$ = K.createMockProperty(
    initialData || {
      sys: {
        type: 'Entry',
        id: 'EID'
      }
    }
  );
  data$.onValue(data => {
    currentData = data;
  });

  const reverter = {
    hasChanges: sinon.stub(),
    revert: sinon.stub().resolves()
  };

  const permissions = {
    can: sinon.stub().returns(true),
    canEditFieldLocale: sinon.stub().returns(true)
  };

  const sysProperty = valuePropertyAt(['sys']);

  const resourceState = createResourceState(sysProperty, setSys, getData, spaceEndpoint);

  return {
    destroy: _.noop,
    getVersion: sinon.stub(),

    state: {
      isDirty$: K.createMockProperty(),
      isSaving$: K.createMockProperty(false),
      canEdit$: K.createMockProperty(true),
      isConnected$: K.createMockProperty(true),
      loaded$: K.createMockProperty(true),
      error$: K.createMockStream()
    },

    status$: K.createMockProperty('ok'),

    getData: sinon.spy(getData),
    data$: data$,

    getValueAt: sinon.spy(getValueAt),

    setValueAt: sinon.spy(setValueAt),
    removeValueAt: sinon.spy(path => setValueAt(path, undefined)),
    insertValueAt: sinon.spy(insertValueAt),
    pushValueAt: sinon.spy(pushValueAt),

    // TODO should emit when calling setters
    changes: K.createMockStream(),
    localFieldChanges$: K.createMockStream(),

    valuePropertyAt: sinon.spy(valuePropertyAt),
    sysProperty: sysProperty,

    collaboratorsFor: sinon.stub().returns(K.createMockProperty([])),
    notifyFocus: sinon.spy(),

    reverter: reverter,
    permissions: permissions,
    resourceState: resourceState
  };

  function setSys(sys) {
    setValueAt(['sys'], sys);
  }

  function getData() {
    return getValueAt([]);
  }

  function getValueAt(path) {
    return _.cloneDeep(getAtPath(currentData, path));
  }

  function valuePropertyAt(path) {
    return data$.map(data => _.cloneDeep(getAtPath(data, path)));
  }

  function getAtPath(obj, path) {
    if (Array.isArray(path) && path.length === 0) {
      return obj;
    } else {
      return _.get(obj, path);
    }
  }

  function insertValueAt(path, pos, val) {
    const list = getValueAt(path);
    list.splice(pos, 0, val);
    setValueAt(path, list);
    return $q.resolve(val);
  }

  function pushValueAt(path, val) {
    const list = getValueAt(path);
    list.push(val);
    setValueAt(path, list);
    return $q.resolve(val);
  }

  function setValueAt(path, value) {
    if (!path.length) {
      // If no path is specified, replace entire data object
      data$.set(_.cloneDeep(value));
      return $q.resolve(value);
    } else {
      const data = _.cloneDeep(currentData);
      _.set(data, path, value);
      data$.set(data);
      return $q.resolve(value);
    }
  }
}
