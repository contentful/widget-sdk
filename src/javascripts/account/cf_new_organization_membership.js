'use strict';

angular.module('contentful')
.directive('cfNewOrganizationMembership', ['require', function (require) {
  
  var h = require('ui/Framework').h;
  var K = require('utils/kefir');
  var tokenStore = require('services/TokenStore');
  var RoleRepository = require('RoleRepository');
  var { ADMIN_ROLE_ID } = require('access_control/SpaceMembershipRepository');

  var navState$ = require('navigation/NavState').navState$
    .filter(state => {
      return Object.keys(state).length
    });
  
  return {
    template: '<cf-component-bridge component="component">',
    scope: {
      context: '='
    },
    controller: ['$scope', function ($scope) {
      let state = {
        spaceMemberships: {}
      };
      const adminRole = {
        name: 'Admin',
        id: ADMIN_ROLE_ID
      };

      $scope.component = h('div', ['...loading']);
      
      let spacesByOrg$ = tokenStore.spacesByOrganization$
        .filter(spaces => {
          return spaces && Object.keys(spaces).length
        });
      let spaces$ = navState$
        .combine(spacesByOrg$)
        .map(([navState, spacesByOrg]) => {
          return spacesByOrg[navState.org.sys.id];
        });
      let roles$ = spaces$
        .flatMap((spaces) => {
          let roles = spaces.map(space => {
            return K.fromPromise(RoleRepository.getInstance(space).getAll());
          });

          return K.combine(roles);
        })
        .map(roles => {
          let allRoles = roles
            .reduce((a, b) => a.concat(b), [])
            .map(role => ({
              name: role.name,
              id: role.sys.id,
              spaceId: role.sys.space.sys.id
            }));
          return _.groupBy(allRoles, _.property('spaceId'))
        });

      K.onValueScope($scope, spaces$.combine(roles$).take(1), ([spaces, roles]) => {
        state = {
          ...state,
          spaces,
          rolesBySpace: roles
        };
        update();
      });

      function update () {
        $scope.context.ready = true;
        $scope.component = render(state);
        debugger;
      }

      function updateSpaceRole(evt, role) {
        if (evt.target.checked) {
          addRole(role);
        } else {
          removeRole(role);
        }
        update();
      }

      function addRole(role) {
        let { spaceMemberships } = state;
        let spaceRoles = spaceMemberships[role.spaceId] || [];

        if (!spaceRoles.includes(role.id)) {
          spaceRoles = [
            ...spaceRoles,
            role.id
          ];
          state.spaceMemberships[role.spaceId] = spaceRoles;
        }
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

      function render ({spaces, rolesBySpace}) {
        return h('form', {}, [
          h('table.deprecated-table', [
            h('thead', [
              h('th', ['Space']),
              h('th', {
                colspan: `${getBiggestLength(Object.values(rolesBySpace)) + 1}` //add 1 for Admin
              }, ['Roles'])
            ]),
            h('tbody', spaces.map(space => {
              let roles = rolesBySpace[space.data.sys.id];
              return h('tr', [
                h('td', [space.data.name]),
                roleCell({...adminRole, spaceId: space.data.sys.id}),
                ...roles.map(role => roleCell(role))
              ]);
            }))
          ])
        ])
      }
      
    }]
  };
}]);
