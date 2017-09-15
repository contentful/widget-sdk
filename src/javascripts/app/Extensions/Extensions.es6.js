import {h} from 'ui/Framework';
import {table} from 'ui/Content/Table';
import widgets from 'widgets';
import {container} from 'ui/Layout';
import notification from 'notification';
import spaceContext from 'spaceContext';
import Sidebar from 'app/Extensions/Sidebar';
import Icon from 'svg/page-settings';

export default function controller ($scope) {
  renderWithScope();
  $scope.context = {ready: true};

  function renderWithScope () {
    $scope.extensions = Object.values(widgets.getCustom()) || [];
    $scope.component = render($scope.extensions);
  }

  function render (extensions) {
    return h('.workbench', [
      h('header.workbench-header', [
        h('.workbench-header__icon', {
          style: {transform: 'scale(0.75)'}
        }, [
          Icon
        ]),
        h('h1.workbench-header__title', [`Extensions (${extensions.length})`])
      ]),
      h('.workbench-main', [
        container({padding: '2em 3em'}, [
          extensions.length ? list(extensions) : empty()
        ]),
        Sidebar()
      ])
    ]);
  }

  function list (extensions) {
    const body = extensions.map((extension) => {
      return h('tr', [
        h('td', [extension.name]),
        h('td', [
          h('code', [extension.id])
        ]),
        h('td', [
          extension.fieldTypes.join(', ')
        ]),
        h('td', [
          deleteButton(extension)
        ])
      ]);
    });

    const head = [
      h('th', ['Name']),
      h('th', ['ID']),
      h('th', ['Field types']),
      h('th', ['Actions'])
    ];

    return h('div', {dataTestId: 'extensions.list'}, [
      table(head, body)
    ]);
  }

  function deleteButton (extension) {
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

function empty () {
  const head = [
    h('th', ['Name']),
    h('th', ['ID']),
    h('th', ['Field types']),
    h('th', ['Actions'])
  ];

  return h('div', {dataTestId: 'extensions.empty'}, [
    table(head, [
      h('tr', [
        h('td', [
          'There are no custom extensions currently installed in this space'
        ])
      ])
    ])
  ]);
}
