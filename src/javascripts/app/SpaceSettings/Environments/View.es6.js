import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { get } from 'lodash';
import * as Config from 'Config.es6';
import { assign } from 'utils/Collections.es6';
import { caseofEq } from 'sum-types';
import { href } from 'states/Navigator.es6';
import { subscription as subscriptionState } from 'ui/NavStates/Org.es6';
import Workbench from 'app/common/Workbench.es6';
import { LinkOpen, CodeFragment } from 'ui/Content.es6';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tag
} from '@contentful/ui-component-library';
import { byName as Colors } from 'Styles/Colors.es6';

import QuestionMarkIcon from 'svg/QuestionMarkIcon.es6';
import Icon from 'ui/Components/Icon.es6';
import CopyIconButton from 'ui/Components/CopyIconButton.es6';
import { Tooltip } from 'react-tippy';

export default function View({ state, actions }) {
  return (
    <Workbench>
      <Workbench.Header>
        <Workbench.Icon icon="page-settings" />
        <Workbench.Title>Environments</Workbench.Title>
      </Workbench.Header>
      <Workbench.Content>
        <EnvironmentList {...state} {...actions} />
      </Workbench.Content>
      <Workbench.Sidebar>
        <Sidebar {...state} {...actions} />
      </Workbench.Sidebar>
    </Workbench>
  );
}
View.propTypes = {
  state: PropTypes.any.isRequired,
  actions: PropTypes.any.isRequired
};

/**
 * Renders
 * - A loading indicator
 * - The item table
 * - A paginator for the items
 * - A warning message if loading the items failed
 */
function EnvironmentList({ isLoading, loadingError, items, OpenDeleteDialog, OpenEditDialog }) {
  const environments = items.map(env =>
    assign(env, {
      Delete: () => OpenDeleteDialog(env),
      Edit: () => OpenEditDialog(env)
    })
  );

  if (loadingError) {
    return (
      <div className="note-box--warning">
        The list of environments failed to load, try refreshing the page. If the problem persists{' '}
        <LinkOpen key="contact-support-link" url={Config.supportUrl}>
          contact support
        </LinkOpen>
      </div>
    );
  }
  return (
    <div data-test-id="environmentList" aria-busy={isLoading ? 'true' : 'false'}>
      <div
        style={{
          position: 'relative',
          minHeight: '6em'
        }}>
        {isLoading ? (
          <div className="loading-box--stretched">
            <div className="loading-box__spinner" />
            <div className="loading-box__message">Loading</div>
          </div>
        ) : (
          <EnvironmentTable environments={environments} />
        )}
      </div>
    </div>
  );
}

EnvironmentList.propTypes = {
  isLoading: PropTypes.bool,
  loadingError: PropTypes.any,
  items: PropTypes.array,
  OpenDeleteDialog: PropTypes.func,
  OpenEditDialog: PropTypes.func
};

const IN_PROGRESS_TOOLTIP = [
  'This environment is currently being created, it will take a couple ',
  'of minutes. You can leave this page as it’s happening in the background.'
].join('');

const FAILED_TOOLTIP = [
  'Something went wrong with the creation this environment. Try to ',
  'delete it and create it again, if that doesn’t work contact support.'
].join('');

function EnvironmentTable({ environments }) {
  if (environments.length === 0) {
    return <div />;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell style={{ width: '50%' }}>ID</TableCell>
          <TableCell style={{ width: '30%' }}>Status</TableCell>
          <TableCell style={{ width: '9em' }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {environments.map(environment => {
          return (
            <TableRow key={environment.id} data-test-id={`environment.${environment.id}`}>
              <TableCell>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CodeFragment key="environment-code-fragment">{environment.id}</CodeFragment>
                  <div style={{ display: 'inline-block', marginLeft: '6px' }} />
                  <CopyIconButton value={environment.id} />
                  <div style={{ display: 'inline-block', marginLeft: '1.2em' }} />
                  {environment.isMaster && <Tag tagType="muted">Default environment</Tag>}
                </div>
              </TableCell>
              <TableCell>
                {caseofEq(environment.status, [
                  ['ready', () => <Tag tagType="positive">Ready</Tag>],
                  [
                    'inProgress',
                    () => {
                      return (
                        <Tag tagType="warning">
                          In progress {QuestionMarkWithTooltip({ tooltip: IN_PROGRESS_TOOLTIP })}
                        </Tag>
                      );
                    }
                  ],
                  [
                    'failed',
                    () => {
                      return (
                        <Tag tagType="negative">
                          Failed to create {QuestionMarkWithTooltip({ tooltip: FAILED_TOOLTIP })}
                        </Tag>
                      );
                    }
                  ]
                ])}
              </TableCell>
              <TableCell>
                <DeleteButton environment={environment} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

EnvironmentTable.propTypes = {
  environments: PropTypes.array
};

function QuestionMarkWithTooltip({ tooltip }) {
  return (
    <span title={tooltip} style={{ cursor: 'pointer', paddingLeft: '10px' }}>
      <QuestionMarkIcon />
    </span>
  );
}
QuestionMarkWithTooltip.propTypes = {
  tooltip: PropTypes.string.isRequired
};

function DeleteButton({ environment }) {
  return (
    <button
      className="text-link--destructive"
      data-test-id="openDeleteDialog"
      disabled={environment.isMaster}
      onClick={environment.Delete}>
      Delete
    </button>
  );
}
DeleteButton.propTypes = {
  environment: PropTypes.object.isRequired
};

function Sidebar({
  canCreateEnv,
  resource,
  organizationId,
  isLegacyOrganization,
  canUpgradeSpace,
  incentivizeUpgradeEnabled,
  OpenCreateDialog,
  OpenUpgradeSpaceDialog
}) {
  // Master is not included in the api, display +1 usage and limit
  const usage = resource.usage + 1;
  const limit = get(resource, 'limits.maximum', -1) + 1;

  return (
    <div className="entity-sidebar">
      <h2 className="entity-sidebar__heading">Usage</h2>
      <div className="entity-sidebar__text-profile">
        <p data-test-id="environmentsUsage">
          You are using {usage}{' '}
          {limit ? `out of ${limit} environments available ` : pluralize('environment', usage)} in
          this space.
          {/* Note: this results in semantically incorrect html (div within p) */}
          {/* https://github.com/tvkhoa/react-tippy/pull/73 would fix it. */}
          {!isLegacyOrganization && <UsageTooltip resource={resource} />}
        </p>
        {!canCreateEnv &&
          !isLegacyOrganization && (
            <p>
              {limit > 1 && 'Delete existing environments or '}
              {canUpgradeSpace &&
                (limit > 1
                  ? 'change the space to add more'
                  : 'Change change the space to add more')}
              {!canUpgradeSpace &&
                `${
                  limit > 1 ? 'ask' : 'Ask'
                } the administrator of your organization to change the space to add more. `}
            </p>
          )}
      </div>
      <div className="entity-sidebar__widget">
        {canCreateEnv && (
          <button
            data-test-id="openCreateDialog"
            onClick={OpenCreateDialog}
            className="btn-action x--block">
            Add environment
          </button>
        )}
        {!canCreateEnv &&
          !isLegacyOrganization &&
          canUpgradeSpace && (
            <UpgradeButton
              organizationId={organizationId}
              incentivizeUpgradeEnabled={incentivizeUpgradeEnabled}
              OpenUpgradeSpaceDialog={OpenUpgradeSpaceDialog}
            />
          )}
      </div>
      <h2 className="entity-sidebar__heading">Documentation</h2>
      <div className="entity-sidebar__text-profile">
        <p>
          Environments allow you to modify the data in your space without affecting the data in your
          master environment.
        </p>
        <ul>
          <li>
            Read more in the{' '}
            <a
              href="https://www.contentful.com/developers/docs/concepts/domain-model/"
              target="_blank"
              rel="noopener noreferrer">
              Contentful domain model
            </a>{' '}
            document
          </li>
        </ul>
      </div>
    </div>
  );
}
Sidebar.propTypes = {
  canCreateEnv: PropTypes.bool,
  resource: PropTypes.object,
  organizationId: PropTypes.string,
  isLegacyOrganization: PropTypes.bool,
  canUpgradeSpace: PropTypes.bool,
  incentivizeUpgradeEnabled: PropTypes.bool,
  OpenCreateDialog: PropTypes.func.isRequired,
  OpenUpgradeSpaceDialog: PropTypes.func.isRequired
};

function UsageTooltip({ resource }) {
  const limit = get(resource, 'limits.maximum');
  if (!limit) {
    return null;
  }

  const tooltipContent = (
    <div>
      This space type includes {pluralize('sandbox environment', limit, true)}
      <br />
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
      arrow
      duration={0}
      trigger="mouseenter">
      <span data-test-id="environments-usage-tooltip">
        <Icon name="question-mark" />
      </span>
    </Tooltip>
  );
}

UsageTooltip.propTypes = {
  resource: PropTypes.object.isRequired
};

function UpgradeButton({ organizationId, incentivizeUpgradeEnabled, OpenUpgradeSpaceDialog }) {
  if (incentivizeUpgradeEnabled) {
    return (
      <button
        data-test-id="openUpgradeDialog"
        onClick={() => OpenUpgradeSpaceDialog()}
        className="btn-action x--block">
        Upgrade space
      </button>
    );
  } else {
    return (
      <span>
        <a
          href={href(subscriptionState(organizationId, false))}
          data-test-id="subscriptionLink"
          className="text-link">
          Go to the subscription page
        </a>
        to upgrade
      </span>
    );
  }
}
UpgradeButton.propTypes = {
  organizationId: PropTypes.string,
  incentivizeUpgradeEnabled: PropTypes.bool,
  OpenUpgradeSpaceDialog: PropTypes.func.isRequired
};
