'use strict';

var Entity = require('./entity');
var createResourceFactoryMethods = require('./resource_factory');

var User = function User (data, persistenceContext) {
  Entity.call(this, data, persistenceContext);
};

User.prototype = Object.create(Entity.prototype);

User.prototype.getName = function () {
  return this.data.firstName + ' ' + this.data.lastName;
};

var factoryMethods = createResourceFactoryMethods(User, 'users');
User.factoryMethods = {
  getUsers: factoryMethods.getAll,
  getUser: factoryMethods.getById
};

module.exports = User;
