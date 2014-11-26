'use strict';

angular.module('contentful').factory('ooyalaClient', ['$injector', function($injector){
  var assert              = $injector.get('assert');
  var OoyalaErrorMessages = $injector.get('OoyalaErrorMessages');
  var $q                  = $injector.get('$q');

  function OoyalaClient(){
    this.organizationId = null;
    this.clientAdapter  = $injector.get('clientAdapter');
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

    request: function(method, endpoint, payload) {
      assert.defined(this.organizationId, 'Ooyala Client needs the current organization id');

      return this.clientAdapter.request({
        method   : method,
        endpoint : endpoint,
        payload  : payload,
        headers: {
          'X-Contentful-Organization' : this.organizationId
        }
      }).catch(_.bind(this._processError, this));
    },

    raw: function(url) {
      return this._GET(this._endpoint(url));
    },

    assets: function(query) {
      return this._GET(this._endpoint('/v2/assets?' + query));
    },

    asset: function(assetId) {
      return this._GET(this._endpoint('/v2/assets/' + assetId));
    },

    _GET: function(path) {
      return this.request('GET', path);
    },

    _endpoint: function(path) {
      return '/integrations/ooyala' + path;
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
