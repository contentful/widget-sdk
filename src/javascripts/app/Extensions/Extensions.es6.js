import { h } from 'ui/Framework';
import { table, tr, td, th } from 'ui/Content/Table';
import notification from 'notification';
import spaceContext from 'spaceContext';
import PageSettingsIcon from 'svg/page-settings';
import EmptyStateIcon from 'svg/empty-extension';
import { stateLink } from 'ui/Content';
import * as Workbench from 'app/Workbench';
import $state from '$state';
import modalDialog from 'modalDialog';
import { track } from 'analytics/Analytics';
import { toInternalFieldType } from './FieldTypes';
import { get } from 'lodash';

const SDK_URL = 'https://unpkg.com/contentful-ui-extensions-sdk@3';

export default function controller($scope) {
  $scope.component = h('span');
  refresh();

  function refresh() {
    spaceContext.widgets.refresh().then(widgets => {
      $scope.context.ready = true;
      const items = widgets.filter(e => e.custom).sort(alphabetically);
      $scope.component = render(items, refresh);
      $scope.$applyAsync();
    });
  }
}

function alphabetically(a, b) {
  if (a.name.toLowerCase() < b.name.toLowerCase()) {
    return -1;
  } else if (a.name.toLowerCase() > b.name.toLowerCase()) {
    return 1;
  } else {
    return 0;
  }
}

export function getExtensionParameterIds(extension) {
  return {
    installationParams: get(extension, ['parameters', 'installation'], []).map(p => p.id),
    instanceParams: get(extension, ['parameters', 'instance'], []).map(p => p.id)
  };
}

function render(extensions, refresh) {
  return Workbench.withSidebar({
    header: Workbench.header({
      title: [`Extensions (${extensions.length})`],
      icon: PageSettingsIcon,
      actions: [actions()]
    }),
    sidebar: [sidebar()],
    content: extensions.length > 0 ? list(extensions, refresh) : empty()
  });
}

function actions() {
  return h('div', [
    h(
      'button.btn-action.add-entity',
      {
        dataTestId: 'extensions.add',
        cfContextMenuTrigger: true
      },
      ['Add extension ', h('i.fa.fa-chevron-down', { style: { color: 'rgba(255, 255, 255, .4)' } })]
    ),
    h(
      '.context-menu.x--arrow-right',
      {
        cfContextMenu: 'bottom-right'
      },
      [
        h(
          'div',
          {
            role: 'menuitem',
            onClick: createExtension,
            dataTestId: 'extensions.add.new'
          },
          ['Add a new extension']
        ),
        h(
          'div',
          {
            role: 'menuitem',
            onClick: openExamplePicker
          },
          ['Install an example']
        ),
        h(
          'div',
          {
            role: 'menuitem',
            onClick: openGitHubInstaller
          },
          ['Install from GitHub']
        )
      ]
    )
  ]);
}

function createExtension() {
  return install({
    extension: {
      name: 'New extension',
      fieldTypes: [{ type: 'Symbol' }],
      srcdoc:
        [
          '<!DOCTYPE html>',
          `<script src="${SDK_URL}"></script>`,
          '<script>',
          'window.contentfulExtension.init(function(api) {',
          '  console.log(api.field.getValue());',
          '});',
          '</script>'
        ].join('\n') + '\n'
    }
  }).catch(handleInstallError);
}

function openExamplePicker() {
  return modalDialog
    .open({
      template: '<cf-extension-example-picker class="modal-background" />'
    })
    .promise.then(install)
    .catch(handleInstallError);
}

function openGitHubInstaller() {
  return modalDialog
    .open({
      template: '<cf-extension-github-installer class="modal-background" />'
    })
    .promise.then(install)
    .catch(handleInstallError);
}

function install({ extension, type, url }) {
  return spaceContext.cma
    .createExtension({ extension })
    .then(res => $state.go('.detail', { extensionId: res.sys.id }))
    .then(() => {
      notification.info('Your new extension was successfully created.');

      type &&
        url &&
        track('extension:install', {
          type,
          url,
          name: extension.name,
          src: extension.src,
          fieldTypes: toInternalFieldType(extension.fieldTypes),
          ...getExtensionParameterIds(extension)
        });
    });
}

function handleInstallError(err) {
  const wasCancelled = err && Object.keys(err).length === 1 && err.cancelled === true;

  if (err && !wasCancelled) {
    notification.error('There was an error while creating your extension.');
    return Promise.reject(err);
  }
}

function list(extensions, refresh) {
  const head = [
    th(['Name']),
    th(['Hosting']),
    th(['Field type(s)']),
    th(['Instance parameters']),
    th(['Installation parameters']),
    th({ class: 'x--small-cell' }, ['Actions'])
  ];

  const extensionLink = ({ content, id }) =>
    stateLink(content, {
      path: '.detail',
      params: { extensionId: id }
    });

  const body = extensions.map(extension => {
    return tr([
      td([extensionLink({ content: [extension.name], id: extension.id })]),
      typeof extension.src === 'string' && td(['self-hosted']),
      typeof extension.srcdoc === 'string' && td(['Contentful']),
      td([extension.fieldTypes.join(', ')]),
      td([`${extension.parameters.length} definition(s)`]),
      td([
        `${extension.installationParameters.definitions.length} definition(s)`,
        h('br'),
        `${Object.keys(extension.installationParameters.values).length} value(s)`
      ]),
      td({ class: 'x--small-cell' }, [
        extensionLink({
          content: [h('span', { style: { textDecoration: 'underline' } }, ['Edit'])],
          id: extension.id
        }),
        deleteButton(extension, refresh)
      ])
    ]);
  });

  return h('div', { dataTestId: 'extensions.list', style: { padding: '0 1em' } }, [
    table(head, body)
  ]);
}

function deleteButton(extension, refresh) {
  return h('div', [
    h(
      'button.text-link--destructive',
      {
        dataTestId: `extensions.delete.${extension.id}`,
        cfContextMenuTrigger: true
      },
      ['Delete']
    ),
    h(
      '.delete-confirm.context-menu.x--arrow-right',
      {
        cfContextMenu: 'bottom-right'
      },
      [
        h('p', [
          'You are about to remove the extension ',
          h('strong', [extension.name]),
          ". If the extension is in use in any content type you'll have to ",
          'pick a different appearance for the field using it.'
        ]),
        h(
          'button.btn-caution',
          {
            dataTestId: `extensions.deleteConfirm.${extension.id}`,
            onClick: () => deleteExtension(extension, refresh)
          },
          ['Delete']
        ),
        h('button.btn-secondary-action', ['Cancel'])
      ]
    )
  ]);
}

function deleteExtension({ id }, refresh) {
  return spaceContext.cma
    .deleteExtension(id)
    .then(refresh)
    .then(
      () => notification.info('Your extension was successfully deleted.'),
      err => {
        notification.error('There was an error while deleting your extension.');
        return Promise.reject(err);
      }
    );
}

const docsLink = ({ href, text }) =>
  h(
    'a.knowledge-base-link.x--inline',
    {
      href,
      target: '_blank',
      rel: 'noopener noreferrer'
    },
    [text]
  );

function empty() {
  return h('.empty-state', { dataTestId: 'extensions.empty' }, [
    h('div', { style: { transform: 'scale(0.75)' } }, [EmptyStateIcon]),
    h('.empty-state__title', ['There are no extensions installed in this space']),
    h('.empty-state__description', [
      `Contentful UI Extensions are small applications that run inside the Web App.
      Click on "Add extension" to explore your options. You can also read how to `,
      docsLink({
        href: 'https://www.contentful.com/developers/docs/concepts/uiextensions/',
        text: 'get started with extensions'
      }),
      '  or head to the ',
      docsLink({
        href:
          'https://github.com/contentful/ui-extensions-sdk/blob/master/docs/ui-extensions-sdk-frontend.md',
        text: 'API Reference of the UI Extensions SDK'
      }),
      '.'
    ])
  ]);
}

function sidebar() {
  const liLink = link => h('li', [docsLink(link)]);

  return h('div', [
    h('h2.entity-sidebar__heading', { style: { marginTop: 0 } }, ['Documentation']),
    h('.entity-sidebar__text-profile', [
      h('p', [
        `Contentful UI Extensions are small applications that run inside the Web App
        and provide additional functionality for creating content and integration with
        third party services.`
      ]),
      h('ul', [
        liLink({
          href: 'https://www.contentful.com/developers/docs/concepts/uiextensions/',
          text: 'Get started with extensions'
        }),
        liLink({
          href: 'https://github.com/contentful/extensions/tree/master/samples',
          text: 'View examples on GitHub'
        }),
        liLink({
          href:
            'https://github.com/contentful/ui-extensions-sdk/blob/master/docs/ui-extensions-sdk-frontend.md',
          text: 'UI Extensions SDK: API Reference'
        }),
        liLink({
          href:
            'https://www.contentful.com/developers/docs/references/content-management-api/#/reference/ui-extensions',
          text: 'Content Management API: extensions endpoint'
        })
      ])
    ])
  ]);
}
