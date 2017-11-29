'use strict';

var _ = require('lodash-node/modern');

var QueryLinkResolver = exports.QueryLinkResolver = function QueryLinkResolver (wrapInstance) {
  this._wrapInstance = wrapInstance;
  this._instancesByType = {};
  this._unresolvedLinks = {};
};

QueryLinkResolver.prototype = {
  resolve: function (queryResult) {
    var resolvedItems = _.map(queryResult.items, function (item) {
      this.collectUnresolvedLinks(item);
      var wrappedItem = this.storeInstanceInMap(item);
      this.resolveUnresolvedLinksTo(item);
      return wrappedItem;
    }, this);

    _.each(queryResult.includes, function (items) {
      _.each(items, function (item) {
        this.collectUnresolvedLinks(item);
        this.storeInstanceInMap(item);
        this.resolveUnresolvedLinksTo(item);
      }, this);
    }, this);

    return resolvedItems;
  },

  instancesFor: function (type) {
    this._instancesByType[type] = this._instancesByType[type] || {};
    return this._instancesByType[type];
  },

  unresolvedLinksFor: function (type, id) {
    this._unresolvedLinks[type] = this._unresolvedLinks[type] || {};
    this._unresolvedLinks[type][id] = this._unresolvedLinks[type][id] || [];
    return this._unresolvedLinks[type][id];
  },

  lookupLink: function (link) {
    return this.instancesFor(link.sys.linkType)[link.sys.id];
  },

  storeInstanceInMap: function (instance) {
    var type = instance.sys.type;
    var id = instance.sys.id;
    if (this.instancesFor(type)[id]) {
      throw new Error('Instance (' + type + ' ' + id + ') already in map');
    } else {
      var wrappedInstance = this._wrapInstance ? this._wrapInstance(instance) : instance;
      this.instancesFor(type)[id] = wrappedInstance;
      return wrappedInstance;
    }
  },

  collectUnresolvedLinks: function (object) {
    for (var property in object) {
      // if (object[property].type && object[property].type === 'Link') {
      if (this.isLink(object[property])) {
        var target = this.lookupLink(object[property]);
        if (target) {
          object[property] = target;
        } else {
          this.recordUnresolvedLink(object, property);
        }
      } else if (typeof object[property] === 'object') {
        this.collectUnresolvedLinks(object[property]);
      }
    }
  },

  isLink: function (object) {
    var isLink = _.isObject(object) && 'sys' in object && object.sys.type === 'Link';
    return isLink;
  },

  recordUnresolvedLink: function (container, propertyContainingLink) {
    var link = container[propertyContainingLink];
    this.unresolvedLinksFor(link.sys.linkType, link.sys.id).push({
      container: container,
      propertyContainingLink: propertyContainingLink
    });
  },

  resolveUnresolvedLinksTo: function (item) {
    var type = item.sys.type;
    var id = item.sys.id;
    var linkedItem = this.instancesFor(type)[id];
    if (linkedItem) {
      _.each(this.unresolvedLinksFor(type, id), function (link) {
        link.container[link.propertyContainingLink] = linkedItem;
      }, this);
      this.unresolvedLinksFor(type, id).length = 0;
    }
  }

};

exports.resolveQueryLinks = function (queryResult, wrapInstance) {
  var resolver = new QueryLinkResolver(wrapInstance);
  return resolver.resolve(queryResult);
};
