import _ from 'lodash';

angular
  .module('contentful/mocks')
  /**
   * Create mock editor data for entry, asset, and bulk editors.
   *
   * The data shape is the same as the one returned by the
   * 'app/entit_editor/DataLoader' module.
   */
  .factory('mocks/app/entity_editor/DataLoader', [
    'require',
    require => {
      const createDoc = require('mocks/entityEditor/Document').create;

      return {
        makeEditorData: makeEditorData
      };

      function makeEditorData(entity, contentType) {
        const ctId = _.get(contentType, 'sys.id');
        const entitySys = _.get(entity, 'sys', {});
        return {
          entity: {
            data: entity,
            getSys: _.constant(entitySys)
          },
          contentType: {
            getId: _.constant(ctId),
            data: contentType
          },
          fieldControls: {},
          entityInfo: {
            id: entitySys.id,
            type: entitySys.type,
            contentTypeId: ctId,
            contentType: contentType
          },
          openDoc: function() {
            return createDoc(entity);
          }
        };
      }
    }
  ]);
