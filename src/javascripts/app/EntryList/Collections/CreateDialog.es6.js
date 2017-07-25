import {h} from 'ui/Framework';
import modalDialog from 'modalDialog';

export default function openCreateCollectionDialog () {
  return modalDialog.open({
    template: '<cf-component-bridge class="modal-background" component="component">',
    controller ($scope) {
      let name;

      $scope.component = renderDialog({setName, create, cancel});

      function setName (newName) {
        name = newName;
      }

      function cancel () {
        $scope.dialog.cancel();
      }

      function create (e) {
        e.preventDefault();
        $scope.dialog.confirm(name);
      }
    }
  }).promise;
}

function renderDialog ({setName, create, cancel}) {
  return h('.modal-dialog', [
    h('header.modal-dialog__header', [
      h('h1', ['Create a new collection']),
      h('button.modal-dialog__close', {onClick: cancel})
    ]),
    h('.modal-dialog__content', {
      // TODO Use content-only class
      style: {paddingBottom: '30px'}
    }, inputTemplate(setName, create))
  ]);
}


function inputTemplate (setName, create) {
  return [
    h('form', {
      onSubmit: create
    }, [
      h('.cfnext-form__field', [
        h('label', {
          style: { fontWeight: 'bold' }
        }, ['Collection name']),
        h('input.cfnext-form__input', {
          type: 'text',
          maxlength: '150',
          onInput: (e) => setName(e.target.value),
          style: { width: '100%' }
        })
      ]),
      h('button.btn-action', {
        type: 'submit'
      }, ['Create'])
    ])
  ];
}
