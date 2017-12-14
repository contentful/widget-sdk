import * as Config from 'Config';
import { assign } from 'utils/Collections';
import pageSettingsIcon from 'svg/page-settings';
import { caseofEq } from 'libs/sum-types';

import { h } from 'ui/Framework';
import { linkOpen, badge, codeFragment, docsLink } from 'ui/Content';
import { table, tr, td, th } from 'ui/Content/Table';
import { container, vspace, ihspace } from 'ui/Layout';
import * as Workbench from 'app/Workbench';
import { byName as Colors } from 'Styles/Colors';
import questionMarkIcon from 'svg/QuestionMarkIcon';
import copyIcon from 'svg/CopyIcon';
import copyToClipboard from 'utils/DomClipboardCopy';


export default function render (state, actions) {
  return Workbench.withSidebar({
    header: Workbench.header({
      title: [ 'Environments' ],
      icon: pageSettingsIcon
    }),
    sidebar: sidebar(assign(actions, {
      planLimit: state.planLimit,
      usedEnvironments: state.items ? state.items.length : 0
    })),
    content: container({
      padding: '0em 1em'
    }, [ environmentList(state, actions) ])
  });
}


/**
 * Renders
 * - A loading indicator
 * - The item table
 * - A paginator for the items
 * - A warning message if loading the items failed
 */
function environmentList ({
  isLoading,
  loadingError,
  items
}, {
  OpenDeleteDialog,
  OpenEditDialog
}) {
  const environments = items.map((env) => assign(env, {
    Delete: () => OpenDeleteDialog(env),
    Edit: () => OpenEditDialog(env)
  }));

  if (loadingError) {
    return h('.note-box--warning', [
      `The list of tokens failed to load, try refreshing the page. If
      the problem persists `, linkOpen(['contact support'], Config.supportUrl)
    ]);
  } else {
    return h('div', {
      dataTestId: 'pat.list'
    }, [
      container({
        position: 'relative',
        minHeight: '6em'
      }, [
        isLoading &&
        h('.loading-box--stretched', [
          h('.loading-box__spinner'),
          h('.loading-box__message', ['Loading'])
        ]),
        environmentTable(environments)
      ])
    ]);
  }
}

const IN_PROGRESS_TOOLTIP =
  `This environment is currently being created, it will take a couple
  of minutes. You can leave this page as it’s happening in the
  background.`;
const FAILED_TOOLTIP =
  `Something went wrong with the creation this environment. Try to
  delete it and create it again, if that doesn’t work contact support.`;

function environmentTable (environments) {
  if (environments.length === 0) {
    return h('div');
  }

  return table(
    [
      th({ style: { width: '35%' } }, ['Name']),
      th({ style: { width: '25%' } }, ['ID']),
      th({ style: { width: '25%' } }, ['Status']),
      th({ style: { width: '9em' } }, ['Actions'])
    ], environments.map((environment) => {
      return tr({
        key: environment.id
      }, [
        td([
          environment.name,
          ihspace('1.2em'),
          environment.isMaster && badge({}, ['Default environment'])
        ]),
        td([
          codeFragment([ environment.id ]),
          ihspace('6px'),
          h('span', {
            onClick: () => {
              copyToClipboard(environment.id);
            },
            style: { cursor: 'pointer' }
          }, [
            copyIcon()
          ])
        ]),
        td([
          caseofEq(environment.status, [
            ['ready', () => badge({ color: Colors.greenDark }, ['Ready'])],
            ['inProgress', () => {
              return badge({ color: Colors.orangeDark }, [
                'In progress',
                questionMarkWithTooltip({tooltip: IN_PROGRESS_TOOLTIP})
              ]);
            }],
            ['failed', () => {
              return badge({ color: Colors.redDark }, [
                'Failed to create',
                questionMarkWithTooltip({tooltip: FAILED_TOOLTIP})
              ]);
            }]
          ])
        ]),
        td([
          editButton(environment),
          ihspace('1.2em'),
          deleteButton(environment)
        ])
      ]);
    })
  );
}

function questionMarkWithTooltip ({ tooltip }) {
  return h('span', {
    title: tooltip,
    style: {
      cursor: 'pointer'
    }
  }, [
    ihspace('10px'),
    questionMarkIcon()
  ]);
}


function editButton (environment) {
  return h('button.text-link', {
    disabled: environment.isMaster || environment.status !== 'ready',
    onClick: environment.Edit
  }, [ 'Edit' ]);
}

function deleteButton (environment) {
  return h('button.text-link--destructive', {
    disabled: environment.isMaster || environment.status === 'inProgress',
    onClick: environment.Delete
  }, [ 'Delete' ]);
}


function sidebar ({ planLimit, usedEnvironments, OpenCreateDialog }) {
  return [
    h('h2.entity-sidebar__heading', [
      'Add environment'
    ]),
    h('.entity-sidebar__text-profile', [
      h('p', [
        `This space has ${usedEnvironments} out of ${planLimit} environments.`
      ])
    ]),
    h('button.btn-action.x--block', {
      dataTestId: 'openCreateDialog',
      disabled: usedEnvironments >= planLimit,
      onClick: () => OpenCreateDialog()
    }, [ 'Add environment' ]),
    vspace(5),
    h('h2.entity-sidebar__heading', [
      'Documentation'
    ]),
    h('.entity-sidebar__text-profile', [
      h('p', [
        `Environments allow you to modify the data in your space
        without affecting the data in your master environment.`
      ]),
      h('ul', [
        h('li', [
          'Read more in the ',
          docsLink('space environments documentation', 'spaceEnvironments'), '.'
        ])
      ])
    ])
  ];
}
