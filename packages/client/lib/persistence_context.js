'use strict';

var IdentityMap = require('./identity_map');

function PersistenceContext (baseRequest) {
  this._baseRequest = baseRequest;
}

module.exports = PersistenceContext;


PersistenceContext.prototype.changePath = function () {
  return this.withEndpoint(this.endpoint().paths(arguments));
};


PersistenceContext.prototype.withEndpoint = function (endpoint) {
  var clone = new PersistenceContext(endpoint);
  clone.identityMap = this.identityMap;
  return clone;
};


PersistenceContext.prototype.endpoint = function () {
  return this._baseRequest
    .paths(arguments);
};


PersistenceContext.prototype.store = function (entity) {
  if (this.identityMap) { return this.identityMap.store(entity); } else { return entity; }
};


PersistenceContext.prototype.setupIdentityMap = function () {
  if (!this.identityMap) { this.identityMap = new IdentityMap(); }
};
