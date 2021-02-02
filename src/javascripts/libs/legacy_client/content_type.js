import { checkComposeIsInstalled } from 'features/assembly-types';
import { getAlphaHeader, ASSEMBLY_TYPES } from 'alphaHeaders';
import Entity from './entity';
import mixinPublishable from './publishable';
import _ from 'lodash';
import createResourceFactoryMethods from './resource_factory';

const ContentType = function ContentType(data, persistenceContext) {
  data = _.merge(
    {
      name: null,
      fields: [],
    },
    data
  );
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
  const type = this.getType();
  const id = this.getId();
  if (this._publishedVersion && type && id) {
    return '' + type + '.published.' + id;
  } else {
    return Entity.prototype.getIdentity.call(this);
  }
};

ContentType.prototype.endpoint = function (...args) {
  let endpoint = Entity.prototype.endpoint.apply(this, _.toArray(args));
  if (this.getVersion()) {
    // TODO it is not clear where this belongs. For subresources the
    // version header should be ommited
    endpoint = endpoint.putHeaders({ 'X-Contentful-Version': this.getVersion() });
  }
  return endpoint;
};

ContentType.prototype.save = async function (headers = {}, spaceId = '') {
  const flag = await checkComposeIsInstalled(spaceId);
  const assemblyHeaders = flag ? getAlphaHeader(ASSEMBLY_TYPES) : {};
  const combinedHeaders = {
    ...headers,
    ...assemblyHeaders,
  };
  return Entity.prototype.save.call(this, combinedHeaders);
};

ContentType.prototype.publish = async function (version) {
  const self = this;
  const spaceId = _.get(this, ['data', 'sys', 'space', 'sys', 'id'], '');
  const flag = await checkComposeIsInstalled(spaceId);
  const assemblyHeaders = flag ? getAlphaHeader(ASSEMBLY_TYPES) : {};
  return this.endpoint('published')
    .headers({
      'X-Contentful-Version': version,
      ...assemblyHeaders,
    })
    .put()
    .then(function (response) {
      self.update(response);
      return self._registerPublished();
    });
};

ContentType.prototype.unpublish = function () {
  const self = this;
  return this.endpoint('published')
    .delete()
    .then(function (response) {
      self.update(response);
      return self.deletePublished();
    });
};

ContentType.prototype.canPublish = function () {
  const fields = this.data && this.data.fields;
  const hasFields = fields && fields.length > 0;
  const isNew = !this.isPublished();
  const hasUpdates = this.getPublishedVersion() < this.getVersion();
  return !this.isDeleted() && hasFields && (isNew || hasUpdates);
};

ContentType.prototype.getPublishedStatus = function () {
  const persistenceContext = this.persistenceContext;
  return this.endpoint('published')
    .get()
    .then(function (data) {
      const contentType = new ContentType(data, persistenceContext);
      return persistenceContext.store(contentType);
    });
};

ContentType.prototype._registerPublished = function () {
  let publishedData = _.cloneDeep(this.data);
  publishedData = _.merge(publishedData, { sys: { revision: this.getVersion() } });

  let published = new ContentType(publishedData, this.persistenceContext);
  published = this.persistenceContext.store(published);
  delete published.deletedAtVersion;
  return published;
};

ContentType.prototype.deletePublished = function () {
  const publishedContentType = this._registerPublished();
  publishedContentType.setDeleted();
  return publishedContentType;
};

ContentType.prototype.getName = function () {
  const name = this.data && this.data.name;
  const EMPTY = /^\s*$/;
  if (name === null || name === undefined || EMPTY.test(name)) {
    return 'Untitled';
  } else {
    return name;
  }
};

const factoryMethods = createResourceFactoryMethods(ContentType, 'content_types');
ContentType.factoryMethods = {
  getContentType: async function (id) {
    const spaceId = _.get(this, ['data', 'sys', 'id'], '');
    const flag = await checkComposeIsInstalled(spaceId);
    const headers = flag ? getAlphaHeader(ASSEMBLY_TYPES) : {};
    return factoryMethods.getById.call(this, id, headers);
  },
  newContentType: factoryMethods.new,
  createContentType: factoryMethods.create,
  getPublishedContentTypes: function (query) {
    return this.endpoint('public/content_types')
      .payload(query)
      .get()
      .then(this.childResourceFactory(ContentType, 'content_types'));
  },
};

export default ContentType;
