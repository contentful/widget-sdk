import sinon from 'sinon';
import * as K from 'test/utils/kefir';
import _ from 'lodash';
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

angular.module('contentful/mocks').factory('mocks/entityEditor/Document', [
  '$q',
  $q => {
    return {
      create(initialData, spaceEndpoint) {
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
        const docLocalChangesBus = K.createMockProperty();
        const changesStream = K.createMockStream();

        const resourceState = createResourceState(
          sysProperty,
          setSys,
          getData,
          spaceEndpoint,
          docLocalChangesBus
        );

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

          getData: sinon.spy(getData),
          data$: data$,

          getValueAt: sinon.spy(getValueAt),

          setValueAt: sinon.spy(setValueAt),
          removeValueAt: sinon.spy(path => setValueAt(path, undefined)),
          insertValueAt: sinon.spy(insertValueAt),
          pushValueAt: sinon.spy(pushValueAt),

          changes: changesStream,

          sysProperty: sysProperty,

          presence: {
            collaborators: K.createMockProperty([]),
            collaboratorsFor: sinon.stub().returns(K.createMockProperty([])),
            focus: sinon.spy()
          },

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
          }
          return _.get(obj, path);
        }

        function insertValueAt(path, pos, val) {
          const list = getValueAt(path);
          list.splice(pos, 0, val);
          setValueAt(path, list);
          changesStream.emit([path]);
          return $q.resolve(val);
        }

        function pushValueAt(path, val) {
          const list = getValueAt(path);
          list.push(val);
          setValueAt(path, list);
          changesStream.emit([path]);
          return $q.resolve(val);
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
          return $q.resolve(value);
        }
      }
    };
  }
]);
