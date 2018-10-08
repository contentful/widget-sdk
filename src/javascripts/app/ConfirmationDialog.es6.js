import modalDialog from 'modalDialog';

export default function confirm({ title, message }) {
  const dialog = modalDialog.open({
    title: 'Create new space',
    template:
      '<react-component name="app/ConfirmationDialogComponent.es6" class="modal-background" props="modalProps" watch-depth="reference"></react-component>',
    backgroundClose: false,
    persistOnNavigation: false,
    scopeData: {
      modalProps: {
        title,
        message,
        onConfirm,
        onCancel
      }
    }
  });

  function onConfirm() {
    dialog.confirm(true);
  }

  function onCancel() {
    // Yes, we cancel with a confirmation.
    // This is because of the way modalDialog was implemented. The returned promise is fulfilled
    // on `confirm` and rejected on `cancel`. In this case we want to always fulfill the promise
    // with the desired result no to mess with the control flow.
    dialog.confirm(false);
  }

  return dialog.promise;
}
