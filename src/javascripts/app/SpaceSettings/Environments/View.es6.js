import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { get } from 'lodash';
import * as Config from 'Config';
import { assign } from 'utils/Collections';
import { caseofEq } from 'sum-types';
import { href } from 'states/Navigator';
import { subscription as subscriptionState } from 'ui/NavStates/Org';

import { h } from 'ui/Framework';
import { asReact } from 'ui/Framework/DOMRenderer';
import { linkOpen, badge, codeFragment } from 'ui/Content';
import { table, tr, td, th } from 'ui/Content/Table';
import { container, hbox, ihspace } from 'ui/Layout';
import * as Workbench from 'app/Workbench';
import { byName as Colors } from 'Styles/Colors';

import pageSettingsIcon from 'svg/page-settings';
import questionMarkIcon from 'svg/QuestionMarkIcon';
import CopyIconButton from 'ui/Components/CopyIconButton';
import { Tooltip } from 'react-tippy';

export default function render (state, actions) {
  return Workbench.withSidebar({
    header: Workbench.header({
      title: [ 'Environments' ],
      icon: pageSettingsIcon
    }),
    sidebar: sidebar(state, actions),
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
      `The list of environments failed to load, try refreshing the page. If
      the problem persists `, linkOpen(['contact support'], Config.supportUrl)
    ]);
  } else {
    return h('div', {
      dataTestId: 'environmentList',
      ariaBusy: isLoading ? 'true' : 'false'
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

const IN_PROGRESS_TOOLTIP = [
  'This environment is currently being created, it will take a couple ',
  'of minutes. You can leave this page as it’s happening in the background.'
].join('');

const FAILED_TOOLTIP = [
  'Something went wrong with the creation this environment. Try to ',
  'delete it and create it again, if that doesn’t work contact support.'
].join('');

function environmentTable (environments) {
  if (environments.length === 0) {
    return h('div');
  }

  return table(
    [
      th({ style: { width: '50%' } }, ['ID']),
      th({ style: { width: '30%' } }, ['Status']),
      th({ style: { width: '9em' } }, ['Actions'])
    ], environments.map((environment) => {
      return tr({
        key: environment.id,
        dataTestId: `environment.${environment.id}`
      }, [
        td([
          hbox([
            codeFragment([ environment.id ]),
            ihspace('6px'),
            h(CopyIconButton, { value: environment.id }),
            ihspace('1.2em'),
            environment.isMaster && badge({ color: Colors.textLight }, ['Default environment'])
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


function deleteButton (environment) {
  return h('button.text-link--destructive', {
    dataTestId: 'openDeleteDialog',
    disabled: environment.isMaster,
    onClick: environment.Delete
  }, [ 'Delete' ]);
}


function sidebar ({
  canCreateEnv,
  resource,
  organizationId,
  isLegacyOrganization,
  canUpgradeSpace,
  incentivizeUpgradeEnabled
}, {
  OpenCreateDialog,
  OpenUpgradeSpaceDialog
}) {
  // Master is not included in the api, display +1 usage and limit
  const usage = resource.usage + 1;
  const limit = get(resource, 'limits.maximum', -1) + 1;

  return [
    h('h2.entity-sidebar__heading', [
      'Usage'
    ]),
    h('.entity-sidebar__text-profile', [
      h('p', [
        `You are using ${usage} `,
        limit && `out of ${limit} environments available `,
        !limit && `${pluralize('environment', usage)} `,
        'in this space.',
        // Note: this results in semantically incorrect html (div within p)
        // https://github.com/tvkhoa/react-tippy/pull/73 would fix it.
        !isLegacyOrganization && usageTooltip({ resource })
      ]),
      // Don't show limits and upgrade info for v1 orgs
      !canCreateEnv && !isLegacyOrganization && h('p', [
        limit > 1 && 'Delete existing environments or ',
        canUpgradeSpace && (limit > 1 ? 'upgrade ' : 'Upgrade '),
        !canUpgradeSpace && `${limit > 1 ? 'ask' : 'Ask'} the administrator of your organization to upgrade `,
        'the space to add more.'
      ])
    ]),
    h('.entity-sidebar__widget', [
      canCreateEnv && h('button.btn-action.x--block', {
        dataTestId: 'openCreateDialog',
        onClick: () => OpenCreateDialog()
      }, [ 'Add environment' ]),
      !canCreateEnv && !isLegacyOrganization && canUpgradeSpace &&
        upgradeButton({ organizationId, incentivizeUpgradeEnabled }, { OpenUpgradeSpaceDialog })
    ]),

    usage === 1 && h('h2.entity-sidebar__heading', [
      'Documentation'
    ]),
    usage === 1 && h('.entity-sidebar__text-profile', [
      h('p', [
        `Environments allow you to modify the data in your space
        without affecting the data in your master environment.`
      ]),
      h('ul', [
        h('li', [
          'Read more in the ',
          h('a', {
            href: 'http://ctf-doc-app-branch-environments.netlify.com/developers/docs/concepts/domain-model/',
            target: '_blank',
            rel: 'noopener'
          }, ['Contentful domain model']),
          ' document.'
        ])
      ])
    ])
  ];
}

function usageTooltip ({ resource }) {
  const limit = get(resource, 'limits.maximum');
  if (!limit) {
    return '';
  }

  const tooltipContent = (
    <div>
      This space type includes {pluralize('sandbox environment', limit, true)}
      <br/>
      additional to the master environment
    </div>
  );

  return (
    <Tooltip
      html={tooltipContent}
      position="bottom-end"
      style={{
        color: Colors.elementDarkest,
        marginLeft: '0.2em'
      }}
      arrow={true}
      duration={0}
      trigger="mouseenter">
      {asReact(questionMarkIcon())}
    </Tooltip>
  );
}

usageTooltip.propTypes = {
  resource: PropTypes.object.isRequired
};

function upgradeButton ({ organizationId, incentivizeUpgradeEnabled }, { OpenUpgradeSpaceDialog }) {
  if (incentivizeUpgradeEnabled) {
    return h('button.btn-action.x--block', {
      dataTestId: 'openUpgradeDialog',
      onClick: () => OpenUpgradeSpaceDialog()
    }, [ 'Upgrade space' ]);
  } else {
    return h('span', [
      h('a.text-link', {
        href: href(subscriptionState(organizationId, false)),
        dataTestId: 'subscriptionLink'
      }, ['Go to the subscription page']),
      ' to upgrade'
    ]);
  }
}
