import {h, renderString} from 'ui/Framework';

export default [
  SingleActionButton(),
  MultiActionButton(),
  ContextMenu()
].map(renderString).join('');

function SingleActionButton () {
  return InsertMediaButton({
    ngIf: '!isCreateAssetsEnabled || !canUploadMultipleAssets',
    ngClick: 'actions.existingAssets()'
  }, [
    Icon(), ' Insert media'
  ]);
}

function MultiActionButton () {
  return InsertMediaButton({
    ngIf: 'isCreateAssetsEnabled && canUploadMultipleAssets',
    cfContextMenuTrigger: true
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
        ngClick: 'actions.newAssets()'
      }, [
        'Add new media and link'
      ]),
      h('li', {
        type: 'button',
        ngClick: 'actions.existingAssets()'
      }, [
        'Link existing media'
      ])
    ])
  ]);
}

function Icon () {
  return h('i.fa.fa-picture-o');
}
