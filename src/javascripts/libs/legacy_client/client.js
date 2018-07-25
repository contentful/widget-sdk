'use strict';

const PersistenceContext = require('./persistence_context');
const Space = require('./space');
const Request = require('./request');
const mixinChildResourceMethods = require('./child_resources');

const Client = function Client (adapter) {
  const baseRequest = new Request(adapter);
  this.persistenceContext = new PersistenceContext(baseRequest);
};

Client.prototype = {
  endpoint: function (...args) {
    return this.persistenceContext.endpoint().paths(args);
  }
};

mixinChildResourceMethods(Client.prototype);
Space.mixinFactoryMethods(Client.prototype, 'spaces');

module.exports = Client;
