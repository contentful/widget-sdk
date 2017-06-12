'use strict';

angular.module('contentful').directive('cfAddUsersToSpaceNote', ['require', function (require) {
  var h = require('utils/hyperscript').h;

  return {
    restrict: 'E',
    template: addUsersNoteTemplate(),
    controller: 'UserInvitationNotesController'
  };

  function addUsersNoteTemplate () {
    return h('p', [
      h('span.add-users-to-space-note', ['You can only add users to this space who are already part of your organization.&#32;']),
      h('span', { 'data-test-id': 'can-invite-users-to-organization', ngIf: 'canInviteUsersToOrganization()' }, [
        'To invite new users to your organization, and ultimately this space, head to&#32;',
        h('a', { href: '', ngClick: 'goToOrganizationUsers()' }, ['organizations &amp; billing']),
        '.'
      ]),
      h('span', { 'data-test-id': 'cannot-invite-users-to-organization', ngIf: '!canInviteUsersToOrganization()' }, [
        'Inviting new users to your organization can be done by an organization owner or admin.'
      ])
    ]);
  }
}])
.directive('cfNoUsersToAddToSpaceDialog', ['require', function (require) {
  var h = require('utils/hyperscript').h;

  return {
    restrict: 'E',
    template: noUsersToAddToSpaceDialog(),
    controller: 'UserInvitationNotesController'
  };

  function noUsersToAddToSpaceDialog () {
    return h('div', [
      h('p', [
        'There are no users in your organization who are not part of this space already. ',
        h('span', { ngIf: 'canInviteUsersToOrganization()' }, [
          'Go to ',
          h('a', { href: '', ngClick: 'goToOrganizationUsers()' }, ['organizations & billings']),
          ' to invite new users to your organization.'
        ]),
        h('span', { ngIf: '!canInviteUsersToOrganization()' }, [
          'Get in touch with an organization owner or admin to invite new users to your organization.'
        ])
      ]),
      h('button.btn-primary-action.modal-dialog__controls-confirm', {
        type: 'button',
        ngClick: 'dialog.cancel()',
        style: { margin: '10px 0' }
      }, ['Okay, got it'])
    ]);
  }
}])
.controller('UserInvitationNotesController', ['$scope', 'require', function ($scope, require) {
  var spaceContext = require('spaceContext');
  var TheAccountView = require('TheAccountView');
  var OrganizationList = require('services/OrganizationList');
  var organization = spaceContext.organizationContext.organization;

  $scope.canInviteUsersToOrganization = function () {
    return OrganizationList.isOwnerOrAdmin(organization);
  };
  $scope.goToOrganizationUsers = TheAccountView.goToUsers;
}]);
