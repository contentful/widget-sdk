'use strict';

var PersistenceContext = require('./persistence_context');
var Space = require('./space');
var Request = require('./request');
var mixinChildResourceMethods = require('./child_resources');

var Client = function Client (adapter) {
  var baseRequest = new Request(adapter);
  this.persistenceContext = new PersistenceContext(baseRequest);
};

Client.prototype = {
  endpoint: function () {
    return this.persistenceContext.endpoint().paths(arguments);
  }
};

mixinChildResourceMethods(Client.prototype);
Space.mixinFactoryMethods(Client.prototype, 'spaces');

module.exports = Client;
