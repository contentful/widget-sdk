'use strict';

const _ = require('lodash');
const Request = require('./request');
const mixinChildResourceMethods = require('./child_resources');
const dateStringToIso = require('./utils').dateStringToIso;

/**
 * Base class for all entities exposed by the REST API
 *
 * @param {Object}data JSON object returned by the REST API
 * @param {PersistenceContext} persistenceContext Parameters for interacting with the REST
 * API
 */
function Entity(data, persistenceContext) {
  this.handleUpdate = _.bind(this.update, this);
  this.persistenceContext = persistenceContext;
  this.update(data);
}

Entity.prototype = {
  getSys: function() {
    return this.data && this.data.sys;
  },

  getId: function() {
    return this.getSys() && this.data.sys.id;
  },

  getName: function() {
    return this.getId();
  },

  /**
   * Return a string that uniquely identifies a resource on the server.
   *
   * In particular, if the URL for two identities is the same,
   * 'getIdentity()' returns the same string. Returns 'undefined' if
   * the entity is not persisted yet.
   *
   * TODO find a more descriptive name
   */
  getIdentity: function() {
    const id = this.getId();
    const type = this.getType();
    if (id && type) return '' + type + '.' + id;
  },

  getType: function() {
    return this.getSys() && this.data.sys.type;
  },

  getCreatedAt: function() {
    return this.getSys() && dateStringToIso(this.data.sys.createdAt);
  },

  getCreatedBy: function() {
    return this.getSys() && this.data.sys.createdBy;
  },

  getUpdatedAt: function() {
    return this.getSys() && dateStringToIso(this.data.sys.updatedAt);
  },

  getUpdatedBy: function() {
    return this.getSys() && this.data.sys.updatedBy;
  },

  getVersion: function() {
    if (this.isDeleted()) {
      return this.deletedAtVersion;
    } else {
      return (this.data && this.data.sys && this.data.sys.version) || 0;
    }
  },

  setVersion: function(version) {
    if (this.getSys()) {
      this.data.sys.version = version;
    }
  },

  setUpdatedAt: function(date) {
    if (this.getSys()) {
      this.data.sys.updatedAt = date;
    }
  },

  update: function(data) {
    this.data = data;
    return this;
  },

  isDeleted: function() {
    return !!this.deletedAtVersion || !this.data;
  },

  canDelete: function() {
    return !this.isDeleted();
  },

  setDeleted: function() {
    if (!this.isDeleted()) {
      this.markDeletedAtVersion();
    }
  },

  markDeletedAtVersion: function() {
    if (this.getSys() && _.isNumber(this.data.sys.version)) {
      this.deletedAtVersion = this.data.sys.version;
    } else {
      throw new Error('Version is not a number');
    }
  },

  save: function(headers) {
    headers = headers || {};

    let endpoint, method;
    if (!this.getId()) {
      endpoint = this.persistenceContext.endpoint();
      method = 'POST';
    } else {
      endpoint = this.endpoint();
      method = 'PUT';
      if (this.getVersion()) {
        headers['X-Contentful-Version'] = this.getVersion();
      }
    }

    const self = this;
    return endpoint
      .headers(headers)
      .payload(this.data)
      .send(method)
      .then(function(response) {
        self.update(response);
        return self.persistenceContext.store(self);
      });
  },

  delete: function() {
    const self = this;
    return this.endpoint()
      .delete()
      .then(function() {
        self.setDeleted();
        return self.persistenceContext.store(self);
      });
  },

  endpoint: function(...args) {
    const pc = this.persistenceContext;
    const id = this.getId();
    if (id) {
      return pc.endpoint(id).paths(args);
    } else {
      return new Request().throw(new Error('Cannot determine endpoint: Entity does not have id.'));
    }
  }
};

mixinChildResourceMethods(Entity.prototype);

module.exports = Entity;
