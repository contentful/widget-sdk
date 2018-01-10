'use strict';

var _ = require('lodash');
var Entity = require('./entity');
var createResourceFactoryMethods = require('./resource_factory');

var Locale = function Locale (data, persistenceContext) {
  Entity.call(this, data, persistenceContext);
};

Locale.prototype = Object.create(Entity.prototype);

Locale.prototype.serialize = function () {
  return _.omit(this.data, 'default', 'fallback_code', 'internal_code');
};

var baseFactoryMethods = createResourceFactoryMethods(Locale, 'locales');
Locale.factoryMethods = {newLocale: baseFactoryMethods.new};

module.exports = Locale;
