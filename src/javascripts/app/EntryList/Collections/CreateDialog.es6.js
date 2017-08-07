import {h} from 'ui/Framework';
import modalDialog from 'modalDialog';

export default function openCreateCollectionDialog (existingCollections = []) {
  return modalDialog.open({
    template: '<cf-component-bridge class="modal-background" component="component">',
    controller ($scope) {
      createDialogController($scope, existingCollections);
    }
  }).promise;
}

function createDialogController ($scope, existingCollections) {
  const data = {
    name: '',
    namesUsed: existingCollections.map(coll => coll.name),
    cancel: () => $scope.dialog.cancel(),
    setName: (name) => {
      data.name = name;
      rerender();
    },
    create: (e) => {
      e.preventDefault();
      $scope.dialog.confirm(data.name);
    }
  };

  rerender();

  function rerender () {
    $scope.component = renderDialog(data);
    $scope.$applyAsync();
  }
}

function renderDialog (props) {
  return h('.modal-dialog', {
    style: { width: '500px' }
  }, [
    h('header.modal-dialog__header', [
      h('h1', ['Create a new collection']),
      h('button.modal-dialog__close', {onClick: props.cancel})
    ]),
    h('.modal-dialog__only-content', inputTemplate(props))
  ]);
}

function inputTemplate ({name, namesUsed, setName, create}) {
  const isNameUsed = namesUsed.indexOf(name) > -1;
  const isDisabled = isNameUsed || name.length < 1;

  return [
    h('form', {
      onSubmit: create
    }, [
      h('.cfnext-form__field', [
        h('p', [
          `A collection is a group of entries selected by you. You can
          organize your work with collections. They always stay private.`
        ]),
        h('label', {
          style: { fontWeight: 'bold' }
        }, [
          'Please provide a name for your collection:'
        ]),
        h('input.cfnext-form__input--full-size', {
          type: 'text',
          maxlength: '64',
          placeholder: 'My collection',
          onInput: (e) => setName(e.target.value || ''),
          style: { width: '100%' }
        })
      ]),
      h('button.btn-action', {
        disabled: isDisabled ? 'disabled' : '',
        type: 'submit'
      }, [
        isNameUsed ? `"${name}" is already used` : 'Create'
      ])
    ])
  ];
}
