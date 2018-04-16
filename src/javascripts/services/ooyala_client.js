'use strict';

angular.module('contentful').factory('ooyalaClient', ['require', function (require){
  var OoyalaErrorMessages = require('OoyalaErrorMessages');
  var client              = require('client');
  var $q                  = require('$q');

  var BASE_URL = '/integrations/ooyala';

  function OoyalaClient(){
    this.organizationId = null;
  }

  OoyalaClient.prototype = {
    errorCodes: {
      INVALID_ASSET_ID    : 1,
      MISSING_CREDENTIALS : 2,
      UNKNOWN_ERROR       : 3
    },

    setOrganizationId: function(organizationId) {
      this.organizationId = organizationId;
    },

    request: function(method, path, payload) {
      return client.request({
        method   : method,
        path     : path,
        payload  : payload,
        headers: {
          'X-Contentful-Organization' : this.organizationId
        }
      }).catch(_.bind(this._processError, this));
    },

    raw: function(url) {
      return this._GET(this._composePath(url));
    },

    assets: function(query) {
      return this._GET(this._composePath('/v2/assets?' + query));
    },

    asset: function(assetId) {
      return this._GET(this._composePath('/v2/assets/' + assetId));
    },

    _GET: function(path) {
      return this.request('GET', path);
    },

    _composePath: function(path) {
      return BASE_URL + path;
    },

    /*
     * TODO? move this to a separete service/class
     * and leave here only the code that deals with
     * the requests
     */
    _processError: function(response) {
      if (
        response.statusCode == 403 &&
        response.body && response.body.message &&
        response.body.message == 'Missing credentials'
      )
        return $q.reject(this._wrapError(
          response,
          OoyalaClient.prototype.errorCodes.MISSING_CREDENTIALS,
          OoyalaErrorMessages.missingCredentials
        ));

      if (response.statusCode == 404)
        return $q.reject(this._wrapError(
          response,
          OoyalaClient.prototype.INVALID_ASSET_ID,
          OoyalaErrorMessages.invalidAssetID
        ));

      return $q.reject(this._wrapError(
        response,
        OoyalaClient.prototype.UNKNOWN_ERROR,
        OoyalaErrorMessages.unknownError
      ));
    },

    _wrapError: function(response, code, message) {
      return {
        response : response,
        code     : code,
        message  : message
      };
    }
  };

  return new OoyalaClient();
}]);
