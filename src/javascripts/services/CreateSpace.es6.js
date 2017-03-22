import modalDialog from 'modalDialog';
import spaceContext from 'spaceContext';
import $rootScope from '$rootScope';

/**
 * Displays the space creation dialog. Refreshes content types on successful
 * space creation. Accepts one optional parameter - `organizationId`, which
 * represents the organization to be pre-selected from the dropdown list.
 *
 * @param {string} [organizationId]
 */
export function showDialog (organizationId) {
  return modalDialog.open({
    title: 'Space templates',
    template: 'create_new_space_dialog',
    backgroundClose: false,
    persistOnNavigation: true,
    scopeData: {
      organizationId: organizationId
    }
  })
  .promise
  .then(handleSpaceCreationSuccess);
}

function handleSpaceCreationSuccess (template) {
  if (template) {
    spaceContext.refreshContentTypesUntilChanged().then(function () {
      $rootScope.$broadcast('reloadEntries');
    });
  } else {
    spaceContext.refreshContentTypes();
  }
}
