import {h, renderString} from 'ui/Framework';

const TEST_ID_LINK_EXISTING = 'markdownEditor.linkExistingAssets';
const TEST_ID_UPLOAD_AND_LINK = 'markdownEditor.uploadAssetsAndLink';
const TEST_ID_DROPDOWN = 'markdownEditor.insertMediaDropdownTrigger';

export default [
  SingleActionButton(),
  MultiActionButton(),
  ContextMenu()
].map(renderString).join('');

function SingleActionButton () {
  return InsertMediaButton({
    ngIf: '!isCreateAssetsEnabled || !canUploadMultipleAssets',
    ngClick: 'actions.existingAssets()',
    dataTestId: TEST_ID_LINK_EXISTING
  }, [
    Icon(), ' Insert media'
  ]);
}

function MultiActionButton () {
  return InsertMediaButton({
    ngIf: 'isCreateAssetsEnabled && canUploadMultipleAssets',
    cfContextMenuTrigger: true,
    dataTestId: TEST_ID_DROPDOWN
  }, [
    Icon(),
    ' Insert media ',
    h('cf-icon', {
      name: 'dd-arrow-down-disabled'
    })
  ]);
}

function InsertMediaButton (attributes, children) {
  return h('button.toolbar-button.markdown-insert-media.markdown-side-action',
    Object.assign({
      tabindex: '-1',
      ngDisabled: 'isDisabled'
    }, attributes),
    children
  );
}

function ContextMenu () {
  return h('.context-menu', {
    cfContextMenu: 'bottom',
    ngHide: 'isDisabled'
  }, [
    h('ul.context-menu__items', [
      h('li', {
        type: 'button',
        ngClick: 'actions.newAssets()',
        dataTestId: TEST_ID_UPLOAD_AND_LINK
      }, [
        'Add new media and link'
      ]),
      h('li', {
        type: 'button',
        ngClick: 'actions.existingAssets()',
        dataTestId: TEST_ID_LINK_EXISTING
      }, [
        'Link existing media'
      ])
    ])
  ]);
}

function Icon () {
  return h('i.fa.fa-picture-o');
}
