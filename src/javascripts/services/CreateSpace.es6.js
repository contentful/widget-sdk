import modalDialog from 'modalDialog';

/**
 * Displays the space creation dialog. Refreshes content types on successful
 * space creation. Accepts one optional parameter - `organizationId`, which
 * represents the organization to be pre-selected from the dropdown list.
 *
 * @param {string} [organizationId]
 */
export function showDialog (organizationId) {
  modalDialog.open({
    title: 'Space templates',
    template: '<cf-create-new-space class="modal-background"></cf-create-new-space>',
    backgroundClose: false,
    persistOnNavigation: true,
    scopeData: {organizationId}
  });
}
