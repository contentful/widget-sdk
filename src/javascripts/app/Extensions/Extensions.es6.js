import {h} from 'ui/Framework';
import {table, tr, td, th} from 'ui/Content/Table';
import widgets from 'widgets';
import {container} from 'ui/Layout';
import notification from 'notification';
import spaceContext from 'spaceContext';
import Sidebar from 'app/Extensions/Sidebar';
import PageSettingsIcon from 'svg/page-settings';
import EmptyStateIcon from 'svg/empty-extension';
import {docsLink} from 'ui/Content';

export default function controller ($scope) {
  renderWithScope();

  widgets.refresh().then(() => {
    $scope.context = {ready: true};
    renderWithScope();
  });

  function renderWithScope () {
    $scope.extensions = widgets.getCustom();
    $scope.component = render($scope.extensions, deleteExtension);
  }

  function deleteExtension ({id}) {
    spaceContext.cma.deleteExtension(id)
    .then(function () {
      notification.info('Extension successfully deleted');
      widgets.refresh().then(renderWithScope);
    })
    .catch(function () {
      notification.error('Error deleting extension');
    });
  }
}

function render (extensions, deleteExtension) {
  return h('.workbench', [
    h('header.workbench-header', [
      h('.workbench-header__icon', {
        style: {transform: 'scale(0.75)'}
      }, [
        PageSettingsIcon
      ]),
      h('h1.workbench-header__title', [`Extensions (${extensions.length})`])
    ]),
    extensions.length ? list(extensions, deleteExtension) : empty()
  ]);
}

function list (extensions, deleteExtension) {
  const head = [
    th(['Name']),
    th(['ID']),
    th(['Field types']),
    th(['Actions'])
  ];

  const body = extensions.map((extension) => {
    return tr([
      td([extension.name]),
      td([h('code', [extension.id])]),
      td([extension.fieldTypes.join(', ')]),
      td([deleteButton(extension, deleteExtension)])
    ]);
  });

  return h('.workbench-main', {dataTestId: 'extensions.list'}, [
    container({padding: '2em 3em'}, [
      table(head, body)
    ]),
    Sidebar()
  ]);
}

function deleteButton (extension, deleteExtension) {
  return h('div', [
    h('button.text-link--destructive', {
      dataTestId: `extensions.delete.${extension.id}`,
      cfContextMenuTrigger: true
    }, [
      'Delete'
    ]),
    h('.delete-confirm.context-menu.x--arrow-right', {
      style: {display: 'none'},
      cfContextMenu: 'bottom-right'
    }, [
      h('p', [
        'You are about to remove the extension ',
        h('strong', [extension.name]),
        '. If it is in use in any content types the default will be used instead.'
      ]),
      h('button.btn-caution', {
        dataTestId: `extensions.deleteConfirm.${extension.id}`,
        onClick: () => deleteExtension(extension)
      }, ['Delete']),
      h('button.btn-secondary-action', ['Cancel'])
    ])
  ]);
}

function empty () {
  return h('.workbench-main', {dataTestId: 'extensions.empty'}, [
    h('.empty-state', {}, [
      h('div', {style: {transform: 'scale(0.75)'}}, [
        EmptyStateIcon
      ]),
      h('.empty-state__title', [
        'There are no extensions installed in this space'
      ]),
      h('.empty-state__description', [
        `The UI extensions SDK allows you to build customized editing
        experiences for the Contentful web application. Learn how to `,
        docsLink('Get started with extensions', 'uiExtensionsGuide'),
        '  or head to the ',
        docsLink('UI extensions API reference', 'uiExtensions'),
        '.'
      ])
    ])
  ]);
}
