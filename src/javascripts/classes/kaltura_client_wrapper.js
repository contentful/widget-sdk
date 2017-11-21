'use strict';

angular.module('contentful').factory('kalturaClientWrapper', ['require', function (require) {
  var $window              = require('$window');
  var $q                   = require('$q');
  var assert               = require('assert');
  var KalturaErrorMessages = require('KalturaErrorMessages');
  var kalturaCredentials   = require('kalturaCredentials');


  var KalturaAPIResponseCodes = {
    entryNotFound : 'ENTRY_ID_NOT_FOUND',
    invalidKS     : 'INVALID_KS'
  };

  function KalturaClientWrapper(){ }

  KalturaClientWrapper.prototype = {
    setOrganizationId: function(organizationId) {
      this._organizationId = organizationId;
    },

    entry: function(entryId) {
      return this._queryKalturaAPI('baseEntry', 'get', [entryId, null]);
    },

    list: function(filter, pager) {
      return this._queryKalturaAPI('baseEntry', 'listAction', [filter, pager]);
    },

    getCategoryId: function () {
      return this.client.categoryId;
    },

    init: function(){
      return this._setupKalturaEnvironment();
    },

    _queryKalturaAPI: function(service, action, args) {
      var deferred = $q.defer();
      var that     = this;

      this._setupKalturaEnvironment()
        .then(function(){
          that.client[service][action].apply(
              that.client[service],
              [_.bind(that._processResponseFromKalturaAPI, that, deferred)].concat(args)
          );
        })
        .catch(function(error){
          deferred.reject(error);
        });

      return deferred.promise;
    },

    _processResponseFromKalturaAPI: function(deferred, _, response){
      if (response.code){
        deferred.reject({
          code: response.code,
          message: this._messageForErrorCode(response.code)
        });
      } else {
        deferred.resolve(response);
      }
    },

    _messageForErrorCode: function(errorCode) {
      switch (errorCode) {
        case KalturaAPIResponseCodes.entryNotFound:
          return KalturaErrorMessages.invalidEntryId;
        case KalturaAPIResponseCodes.invalidKS:
          return KalturaErrorMessages.invalidKS;
        default:
          return KalturaErrorMessages.unknownError;
      }
    },

    _initKalturaServices: function(partner_id, token, categoryId) {
        var config = new $window.KalturaConfiguration(partner_id);

        config.serviceUrl = 'https://www.kaltura.com/';
        this.client       = new $window.KalturaClient(config);
        /*
         * callsQueue stores the calls that are pending to
         * execute on the client. This property is set on
         * KalturaClientBase.prototype.callsQueue.
         *
         * Declaring this property like that means that everytime
         * a new client is created it will append more calls to this
         * queue (because the client doesn't have the property and
         * then it looks for the property in its prototype
         * chain). The evident sideeffect of this is that even if
         * the query value is changed the value on the first call
         * will be used anyway.
         *
         * A workaround is to overwrite this property here with a new
         * array.
         */
        this.client.callsQueue = [];
        this.client.ks         = token;
        this.client.categoryId = categoryId;
    },

    _setupKalturaEnvironment: function() {
      var that = this, deferred = $q.defer();
      assert.defined(this._organizationId, 'Kaltura Client Wrapper needs the current organization id');

      kalturaCredentials.get(this._organizationId)
      .then(function(response){
        var kalturaPartnerId    = response.partner_id;
        var kalturaSessionToken = response.session_token;
        var kalturaCategory     = response.category_id;

        that._initKalturaServices(kalturaPartnerId, kalturaSessionToken, kalturaCategory);
        deferred.resolve();
      })
      .catch(function(){
        deferred.reject({message: KalturaErrorMessages.invalidOrMissingCredentials });
      });

      return deferred.promise;
    }

  };

  return new KalturaClientWrapper();
}]);
