import { createDocumentMock } from '../../../test/utils/createDocumentMock';

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

angular
  .module('contentful/mocks')
  .factory('mocks/entityEditor/Document', ['$q', createDocumentMock]);
