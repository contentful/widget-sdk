import { createEditorContextMock } from '../../../test/utils/createEditorContextMock';

angular
  .module('contentful/mocks')
  /**
   * @ngdoc service
   * @name mocks/entityEditor/Context
   * @description
   * Create a mock implementation of the entry and asset editor
   * controllers.
   *
   * The implementation is not yet complete.
   */
  .factory('mocks/entityEditor/Context', createEditorContextMock);
