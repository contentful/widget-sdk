'use strict';

angular.module('contentful')

/**
 * @ngdoc constructor
 * @name EntityInfo
 * @param {Object} entityData TODO: expect only .data
 * @param {SpaceContext} spaceContet TODO: change to contentType
 * @param {string} fallbackLocale
 *
 * @description
 */
.factory('EntityInfo', [function () {

  // TODO: Remove spaceContext dependency and move the used fn's logic in here.
  function EntityInfo (entity, spaceContext, fallbackLocale) {
    this._spaceContext = spaceContext;
    this._entity = entity;
    this._locale = fallbackLocale;
  }
  _.extend(EntityInfo.prototype, {
    // TODO: Replace with `getData` once we switch to use .data only.
    getEntity: function () {
      return this._entity;
    },
    getContentType: function () {
      return this._ct;
    },
    getTitle: function (localeCode) {
      localeCode = localeCode || this._locale;
      return this._spaceContext.entityTitle(this._entity, localeCode);
    },
    getDescription: function (localeCode) {
      localeCode = localeCode || this._locale;
      return this._spaceContext.entityDescription(this._entity, localeCode);
    }
  });

  return EntityInfo;
}]);
