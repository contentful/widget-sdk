import * as K from '__mocks__/kefirMock';
import _ from 'lodash';
import { create as createResourceState } from 'data/document/ResourceStateManager';
import { create as createEntityRepo } from 'data/CMA/EntityRepo';

export const createDocumentMock = () => {
  return {
    create(initialData, spaceEndpoint) {
      let currentData;
      const data$ = K.createMockProperty(
        initialData || {
          sys: {
            type: 'Entry',
            id: 'EID',
          },
        }
      );
      data$.onValue((data) => {
        currentData = data;
      });

      const reverter = {
        hasChanges: jest.fn(),
        revert: jest.fn().mockResolvedValue(),
      };

      const permissions = {
        can: jest.fn().mockReturnValue(true),
        canEditFieldLocale: jest.fn().mockReturnValue(true),
      };

      const sysProperty = valuePropertyAt(['sys']);
      const changesStream = K.createMockStream();

      const entityRepo = createEntityRepo(spaceEndpoint);
      const resourceState = createResourceState({
        sys$: sysProperty,
        setSys,
        getData,
        entityRepo,
      });

      return {
        destroy: _.noop,
        getVersion: jest.fn(),

        state: {
          isDirty$: K.createMockProperty(),
          isSaving$: K.createMockProperty(false),
          canEdit$: K.createMockProperty(true),
          isConnected$: K.createMockProperty(true),
          loaded$: K.createMockProperty(true),
          error$: K.createMockProperty(null),
        },

        getData: jest.fn(getData),
        data$: data$,

        getValueAt: jest.fn(getValueAt),

        setValueAt: jest.fn(setValueAt),
        removeValueAt: jest.fn((path) => setValueAt(path, undefined)),
        insertValueAt: jest.fn(insertValueAt),
        pushValueAt: jest.fn(pushValueAt),

        changes: changesStream,

        sysProperty: sysProperty,

        presence: {
          collaborators: K.createMockProperty([]),
          collaboratorsFor: jest.fn().mockReturnValue(K.createMockProperty([])),
          focus: jest.fn(),
        },

        reverter: reverter,
        permissions: permissions,
        resourceState: resourceState,
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
        return data$.map((data) => _.cloneDeep(getAtPath(data, path)));
      }

      function getAtPath(obj, path) {
        if (Array.isArray(path) && path.length === 0) {
          return obj;
        }
        return _.get(obj, path);
      }

      function insertValueAt(path, pos, val) {
        const list = getValueAt(path);
        list.splice(pos, 0, val);
        setValueAt(path, list);
        changesStream.emit([path]);
        return Promise.resolve(val);
      }

      function pushValueAt(path, val) {
        const list = getValueAt(path);
        list.push(val);
        setValueAt(path, list);
        changesStream.emit([path]);
        return Promise.resolve(val);
      }

      function setValueAt(path, value) {
        if (!path.length) {
          // If no path is specified, replace entire data object
          data$.set(_.cloneDeep(value));
        } else {
          const data = _.cloneDeep(currentData);
          _.set(data, path, value);
          data$.set(data);
        }

        changesStream.emit(path);
        return Promise.resolve(value);
      }
    },
  };
};
