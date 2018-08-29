'use strict';

angular
  .module('cf.data')

  /**
   * @ngdoc service
   * @module cf.data
   * @name data/editingInterfaces
   */
  .factory('data/editingInterfaces', [
    'require',
    require => {
      const $q = require('$q');
      const Transformer = require('data/editingInterfaces/transformer');

      return function createEIRepo(spaceEndpoint) {
        return {
          get: get,
          save: save,

          /**
           * @ngdoc method
           * @name data/editingInterfaces#syncControls
           * @description
           * Reexport of the [transformer method][1].
           *
           * [1]: api/cf.data/service/data/editingInterfaces/transformer
           *
           * @param {Data.ContentType} ct
           * @param {Data.EditingInterface} ei
           */
          syncControls: Transformer.syncControls
        };

        /**
         * @ngdoc method
         * @name data/editingInterfaces#get
         * @param {Data.ContentType} ct
         * @returns {Promise<Data.EditingInterface>}
         */
        function get(contentType) {
          // We may pass published content type data so we need to check
          // revision
          if (!contentType.sys.revision && !contentType.sys.version) {
            return $q.resolve(Transformer.makeDefault(contentType));
          }

          return spaceEndpoint({
            method: 'GET',
            path: makePath(contentType)
          }).then(
            editingInterface => Transformer.fromAPI(contentType, editingInterface),
            createErrorResponseHandler(404, () => Transformer.makeDefault(contentType))
          );
        }

        // TODO this might be useful in other places
        function createErrorResponseHandler(statusCode, handler) {
          return error => {
            if (error.status === statusCode) {
              return handler(error);
            } else {
              return $q.reject(error);
            }
          };
        }

        /**
         * @ngdoc method
         * @name data/editingInterfaces#save
         * @param {Data.ContentType} ct
         * @param {Data.EditingInterface} ei
         * @returns {Promise<Data.EditingInterface>}
         */
        function save(contentType, data) {
          data = Transformer.toAPI(contentType, data);
          return spaceEndpoint({
            method: 'PUT',
            path: makePath(contentType),
            version: data.sys.version,
            data: data
          }).then(editingInterface => Transformer.fromAPI(contentType, editingInterface));
        }
      };

      function makePath(contentType) {
        return ['content_types', contentType.sys.id, 'editor_interface'];
      }
    }
  ]);
