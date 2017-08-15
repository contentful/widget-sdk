import {h} from 'ui/Framework';
import {table} from 'ui/Content/Table';
import widgets from 'widgets';
import {container, vspace} from 'ui/Layout';
import notification from 'notification';
import spaceContext from 'spaceContext';

export default function controller ($scope) {
  renderWithScope();
  $scope.context = {ready: true};

  function renderWithScope () {
    $scope.extensions = Object.values(widgets.getCustom()) || [];
    $scope.component = render($scope.extensions);
  }

  function render (extensions) {
    return container({padding: '2em 3em'}, [
      extensions.length ? list(extensions) : empty()
    ]);
  }

  function list (extensions) {
    const body = extensions.map((extension) => {
      return h('tr', [
        h('td', {
          style: {
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }
        }, [
          h('h4', {style: {marginTop: '0'}}, [extension.name]),
          h('div', {style: {fontSize: '0.85em'}}, [`(ID: ${extension.id})`])
        ]),
        h('td', {style: {
          width: '7em',
          textAlign: 'right'
        }}, [
          deleteButton(extension)
        ])
      ]);
    });

    const head = [
      h('th', ['Name']),
      h('th', [''])
    ];

    return h('div', {dataTestId: 'extensions.list'}, [
      h('p', ['The following custom extensions are installed in this space.']),
      vspace(5),
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
  return h(
    'p', {dataTestId: 'extensions.empty'},
    ['There are no custom extensions currently installed in this space.']
  );
}
