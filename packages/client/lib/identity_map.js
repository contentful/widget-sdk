'use strict';


function IdentityMap () {
  this._entities = {};
}

module.exports = IdentityMap;


/**
 * Add or update 'entity' and return unique reference to the shared
 * version.
 */
IdentityMap.prototype.store = function (entity) {
  var identity = entity.getIdentity && entity.getIdentity();
  if (!identity) { return entity; }

  var existing = this._get(identity);
  if (!existing) {
    this._set(identity, entity);
    return entity;
  }

  var currentVersion = existing.getVersion();
  var newVersion = entity.getVersion();
  if (currentVersion === undefined || currentVersion <= newVersion) { existing.update(entity.data); }
  return existing;
};


IdentityMap.prototype._get = function (identity) {
  return this._entities[identity];
};

IdentityMap.prototype._set = function (identity, entity) {
  this._entities[identity] = entity;
};
