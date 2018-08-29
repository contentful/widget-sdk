'use strict';

const IdentityMap = require('./identity_map');

function PersistenceContext(baseRequest) {
  this._baseRequest = baseRequest;
}

module.exports = PersistenceContext;

PersistenceContext.prototype.changePath = function(...args) {
  return this.withEndpoint(this.endpoint().paths(args));
};

PersistenceContext.prototype.withEndpoint = function(endpoint) {
  const clone = new PersistenceContext(endpoint);
  clone.identityMap = this.identityMap;
  return clone;
};

PersistenceContext.prototype.endpoint = function(...args) {
  return this._baseRequest.paths(args);
};

PersistenceContext.prototype.store = function(entity) {
  if (this.identityMap) {
    return this.identityMap.store(entity);
  } else {
    return entity;
  }
};

PersistenceContext.prototype.setupIdentityMap = function() {
  if (!this.identityMap) {
    this.identityMap = new IdentityMap();
  }
};
