'use strict';

angular.module('contentful')
.directive('cfNewOrganizationMembership', ['require', function (require) {
  
  var h = require('ui/Framework').h;
  var K = require('utils/kefir');
  var tokenStore = require('services/TokenStore');
  var RoleRepository = require('RoleRepository');
  var { ADMIN_ROLE_ID } = require('access_control/SpaceMembershipRepository');
  var { runTask } = require('utils/Concurrent');
  
  return {
    template: '<cf-component-bridge component="component">',
    scope: {
      properties: '='
    },
    controller: ['$scope', function ($scope) {
      let state = {
        spaceMemberships: {}
      };
      const adminRole = {
        name: 'Admin',
        id: ADMIN_ROLE_ID
      };

      $scope.component = h('noscript');

      runTask(function* () {
        const allSpaces = yield tokenStore.getFatSpaces();
        const orgSpaces = allSpaces.filter(space => space.data.organization.sys.id === $scope.properties.orgId);
        const rolesPromise = orgSpaces.map(space => {
          return RoleRepository.getInstance(space).getAll();
        });

        const roles = yield Promise.all(rolesPromise);
        const allRoles = roles
          .reduce((a, b) => a.concat(b), [])
          .map(role => ({
            name: role.name,
            id: role.sys.id,
            spaceId: role.sys.space.sys.id
          }));
        
        const rolesBySpace = _.groupBy(allRoles, _.property('spaceId'));
        
        const spacesWithRoles = orgSpaces.map(space => ({
          id: space.data.sys.id,
          name: space.data.name,
          roles: rolesBySpace[space.data.sys.id]
        }));
        

        state = {
          ...state,
          maxNumberOfRoles: getBiggestLength(Object.values(rolesBySpace)) + 1,
          spaces: spacesWithRoles
        };

        update();
      });
      
      function update () {
        $scope.properties.context.ready = true;
        $scope.component = render(state);
      }

      function updateSpaceRole(evt, role) {
        if (evt.target.checked) {
          addRole(role);
        } else {
          removeRole(role);
        }
        update();
        $scope.$applyAsync();
      }

      function addRole(role) {
        let { spaceMemberships } = state;
        let spaceRoles = spaceMemberships[role.spaceId] || [];

        if (role.id === adminRole.id) {
          spaceRoles = [role.id];
        } else {
          spaceRoles = spaceRoles.filter((roleId) => roleId !== adminRole.id);
          spaceRoles.push(role.id);
        }

        state.spaceMemberships[role.spaceId] = spaceRoles;
      }

      function removeRole(role) {
        let { spaceMemberships } = state;
        let spaceRoles = spaceMemberships[role.spaceId];

        spaceRoles = spaceRoles.filter(id => id !== role.id);
        state.spaceMemberships[role.spaceId] = spaceRoles;
      }

      //return the biggest length contained in a two-dimensional array
      function getBiggestLength(arrs) {
        return arrs.reduce((maxLength, arr) => { 
          return Math.max(maxLength, arr.length)
        }, 0)
      }

      function isChecked(role) {
        let memberships = state.spaceMemberships;
        return memberships.hasOwnProperty(role.spaceId) && memberships[role.spaceId].includes(role.id);
      }

      function roleCell(role) {
        return h('td', [
          h('label', [
            h('input', {
              type: 'checkbox',
              checked: isChecked(role),
              onChange: (evt) => updateSpaceRole(evt, role)
            }),
            role.name 
          ])
        ]);
      }

      function render ({spaces, maxNumberOfRoles}) {
        return h('form', {}, [
          h('table.deprecated-table', [
            h('thead', [
              h('th', ['Space']),
              h('th', {
                colspan: `${maxNumberOfRoles}` //add 1 for Admin
              }, ['Roles'])
            ]),
            h('tbody', spaces.map(space => {
              return h('tr', [
                h('td', [space.name]),
                roleCell({...adminRole, spaceId: space.id}),
                ...space.roles.map(role => roleCell(role))
              ]);
            }))
          ])
        ])
      }
      
    }]
  };
}]);
