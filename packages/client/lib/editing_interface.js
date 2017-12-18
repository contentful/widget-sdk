'use strict';

var Entity = require('./entity');
var createResourceFactoryMethods = require('./resource_factory');

var EditingInterface = function EditingInterface (data, persistenceContext) {
  Entity.call(this, data, persistenceContext);
};

EditingInterface.prototype = Object.create(Entity.prototype);

EditingInterface.prototype.getIdentity = function () {
  var id = this.getId();
  var type = this.getType();
  var ctId = this.data && this.data.contentTypeId;
  if (id && type && ctId) return '' + type + '.' + ctId + '.' + id;
};

var factoryMethods = createResourceFactoryMethods(EditingInterface, 'editor_interfaces');
EditingInterface.contentTypeMethods = {
  getEditingInterface: factoryMethods.getById,
  createEditingInterface: function (data) {
    return this.newEditingInterface(data).save();
  },

  newEditingInterface: function (data) {
    data = data || {};
    data.contentTypeId = this.getId();
    return this.childResourceFactory(EditingInterface, 'editor_interfaces')(data);
  }
};

module.exports = EditingInterface;
