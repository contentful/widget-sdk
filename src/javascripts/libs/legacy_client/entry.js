import Entity from './entity';
import mixinPublishable from './publishable';
import mixinArchivable from './archivable';
import createResourceFactoryMethods from './resource_factory';

const Entry = function Entry(data, persistenceContext) {
  Entity.call(this, data, persistenceContext);
};

Entry.prototype = Object.create(Entity.prototype);
mixinPublishable(Entry.prototype);
mixinArchivable(Entry.prototype);

Entry.prototype.getContentTypeId = function () {
  return this.data && this.data.sys.contentType.sys.id;
};

const factoryMethods = createResourceFactoryMethods(Entry, 'entries');
Entry.factoryMethods = {
  getEntry: factoryMethods.getById,
  getEntries: factoryMethods.getByQuery,
  newEntry: factoryMethods.new,
  createEntry: function (contentTypeId, data) {
    return this.newEntry(data).save({
      'X-Contentful-Content-Type': contentTypeId,
    });
  },
};

export default Entry;
