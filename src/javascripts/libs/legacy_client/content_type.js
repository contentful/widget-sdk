'use strict';

var Entity = require('./entity');
var mixinPublishable = require('./publishable');
var _ = require('lodash');
var createResourceFactoryMethods = require('./resource_factory');

var ContentType = function ContentType (data, persistenceContext) {
  data = _.merge({
    name: null,
    fields: []
  }, data);
  Entity.call(this, data, persistenceContext);
};

ContentType.prototype = Object.create(Entity.prototype);
mixinPublishable(ContentType.prototype);

ContentType.prototype.update = function (data) {
  if (this._publishedVersion === undefined && data) {
    this._publishedVersion = !!(data.sys && 'revision' in data.sys);
  }
  Entity.prototype.update.call(this, data);
};

ContentType.prototype.getIdentity = function () {
  var type = this.getType();
  var id = this.getId();
  if (this._publishedVersion && type && id) {
    return '' + type + '.published.' + id;
  } else {
    return Entity.prototype.getIdentity.call(this);
  }
};

ContentType.prototype.endpoint = function (...args) {
  var endpoint = Entity.prototype.endpoint.apply(this, _.toArray(args));
  if (this.getVersion()) {
    // TODO it is not clear where this belongs. For subresources the
    // version header should be ommited
    endpoint = endpoint.putHeaders({'X-Contentful-Version': this.getVersion()});
  }
  return endpoint;
};


ContentType.prototype.publish = function (version) {
  var self = this;
  return this.endpoint('published')
    .headers({
      'X-Contentful-Version': version,
      // TODO: remove this for structured text beta release
      'X-Contentful-Enable-Alpha-Feature': 'structured_text_fields'
    })
    .put()
    .then(function (response) {
      self.update(response);
      return self._registerPublished();
    });
};

ContentType.prototype.unpublish = function () {
  var self = this;
  return this.endpoint('published').delete()
    .then(function (response) {
      self.update(response);
      return self.deletePublished();
    });
};

ContentType.prototype.canPublish = function () {
  var fields = this.data && this.data.fields;
  var hasFields = fields && fields.length > 0;
  var isNew = !this.isPublished();
  var hasUpdates = this.getPublishedVersion() < this.getVersion();
  return !this.isDeleted() && hasFields && (isNew || hasUpdates);
};

ContentType.prototype.getPublishedStatus = function () {
  var persistenceContext = this.persistenceContext;
  return this.endpoint('published').get()
    .then(function (data) {
      var contentType = new ContentType(data, persistenceContext);
      return persistenceContext.store(contentType);
    });
};

ContentType.prototype._registerPublished = function () {
  var publishedData = _.cloneDeep(this.data);
  publishedData = _.merge(publishedData, {sys: { revision: this.getVersion() }});

  var published = new ContentType(publishedData, this.persistenceContext);
  published = this.persistenceContext.store(published);
  delete published.deletedAtVersion;
  return published;
};

ContentType.prototype.deletePublished = function () {
  var publishedContentType = this._registerPublished();
  publishedContentType.setDeleted();
  return publishedContentType;
};

ContentType.prototype.getName = function () {
  var name = this.data && this.data.name;
  var EMPTY = /^\s*$/;
  if (name === null || name === undefined || EMPTY.test(name)) {
    return 'Untitled';
  } else {
    return name;
  }
};

var factoryMethods = createResourceFactoryMethods(ContentType, 'content_types');
ContentType.factoryMethods = {
  getContentType: factoryMethods.getById,
  newContentType: factoryMethods.new,
  createContentType: factoryMethods.create,

  getPublishedContentTypes: function (query) {
    return this.endpoint('public/content_types').payload(query).get()
      .then(this.childResourceFactory(ContentType, 'content_types'));
  }
};

module.exports = ContentType;
