'use strict';

angular.module('contentful').factory('OrganizationList', function () {

  var organizations = [];

  return {
    resetWithUser: resetWithUser,
    isEmpty: isEmpty,
    getOrganization: getOrganization,
    getOrganizationName: getOrganizationName,
    getAll: getAll,
    getCopy: getCopy,
    getWithOnTop: getWithOnTop
  };

  function resetWithUser(user) {
    organizations = _.pluck(user.organizationMemberships, 'organization');
  }

  function isEmpty() {
    return organizations.length === 0;
  }

  function getOrganization(id) {
    var result = _.where(organizations, { sys: { id: id } });
    return result.length > 0 ? result[0] : null;
  }

  function getOrganizationName(id) {
    var organization = getOrganization(id);
    return organization ? organization.name : null;
  }

  function getAll() {
    return organizations;
  }

  function getCopy(deep) {
    return _.clone(organizations, deep);
  }

  function getWithOnTop(organizationId) {
    var organizations = getCopy();
    if (organizationId) {
      organizations.sort(idComparator(organizationId));
    }

    return organizations;
  }

  function idComparator(id) {
    return function (a, b) {
      if (a.sys.id === id) { return -1; }
      if (b.sys.id === id) { return  1; }
      return 0;
    };
  }
});
