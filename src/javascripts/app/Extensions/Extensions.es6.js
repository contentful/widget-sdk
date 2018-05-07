import {h} from 'ui/Framework';
import {table, tr, td, th} from 'ui/Content/Table';
import notification from 'notification';
import spaceContext from 'spaceContext';
import PageSettingsIcon from 'svg/page-settings';
import EmptyStateIcon from 'svg/empty-extension';
import AddEntityIcon from 'svg/plus';
import {docsLink, stateLink} from 'ui/Content';
import * as Workbench from 'app/Workbench';

export default function controller ($scope) {
  renderWithScope();

  spaceContext.widgets.refresh().then(() => {
    $scope.context.ready = true;
    renderWithScope();
  });

  function renderWithScope () {
    $scope.extensions = spaceContext.widgets.getAll().filter(e => e.custom);
    $scope.component = render($scope.extensions, deleteExtension);
  }

  function deleteExtension ({id}) {
    spaceContext.cma.deleteExtension(id)
    .then(function () {
      notification.info('Extension successfully deleted');
      spaceContext.widgets.refresh().then(renderWithScope);
    })
    .catch(function () {
      notification.error('Error deleting extension');
    });
  }
}

function render (extensions, deleteExtension) {
  return Workbench.withSidebar({
    header: Workbench.header({
      title: [`Extensions (${extensions.length})`],
      icon: PageSettingsIcon,
      actions: [actions()]
    }),
    sidebar: [sidebar()],
    content: extensions.length > 0 ? list(extensions, deleteExtension) : empty()
  });
}

function actions () {
  return h('div', [
    h('button.btn-action.add-entity', {
      cfContextMenuTrigger: true
    }, [
      h('span.btn-icon.cf-icon.cf-icon--plus.inverted', [AddEntityIcon]),
      'Create or install Extension'
    ]),
    h('.context-menu.x--arrow-right', {
      cfContextMenu: 'bottom-right'
    }, [
      h('div', {role: 'menuitem'}, ['Create a new Extension']),
      h('div', {role: 'menuitem'}, ['Install a sample']),
      h('div', {role: 'menuitem'}, ['Install from Github'])
    ])
  ]);
}

function list (extensions, deleteExtension) {
  const head = [
    th(['Name']),
    th(['Hosting']),
    th(['Field type(s)']),
    th(['Instance parameters']),
    th(['Installation parameters']),
    th({class: 'x--small-cell'}, ['Actions'])
  ];

  const body = extensions.map((extension) => {
    return tr([
      td([h('strong', {title: `ID: ${extension.id}`}, [extension.name])]),
      extension.src && td(['Self-hosted (', h('code', ['src']), ')']),
      extension.srcdoc && td(['Hosted by Contentful (', h('code', ['srcdoc']), ')']),
      td([extension.fieldTypes.join(', ')]),
      td([`${extension.parameters.length} definition(s)`]),
      td([
        `${extension.installationParameters.definitions.length} definition(s)`,
        h('br'),
        `${Object.keys(extension.installationParameters.values).length} value(s)`
      ]),
      td({class: 'x--small-cell'}, [
        stateLink(['Edit'], {
          path: '.detail',
          params: {extensionId: extension.id}
        }),
        deleteButton(extension, deleteExtension)
      ])
    ]);
  });

  return h('div', {dataTestId: 'extensions.list', style: {padding: '0 1em'}}, [
    table(head, body)
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
  return h('.empty-state', {dataTestId: 'extensions.empty'}, [
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
  ]);
}

function sidebar () {
  return h('div', [
    h('h2.entity-sidebar__heading', {style: {marginTop: 0}}, ['Documentation']),
    h('.entity-sidebar__text-profile', [
      h('p', [
        `The UI extensions SDK allows you to build customized editing
        experiences for the Contentful web application.`
      ]),
      h('p', [
        'Learn more about UI extensions: '
      ]),
      h('ul', [
        h('li', [
          docsLink('Get started with extensions', 'uiExtensionsGuide')
        ]),
        h('li', [
          docsLink('UI extensions API reference', 'uiExtensions')
        ])
      ])
    ])
  ]);
}
