import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { css } from 'emotion';
import { get } from 'lodash';
import * as Config from 'Config.es6';
import { assign } from 'utils/Collections.es6';
import { caseofEq } from 'sum-types';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import { LinkOpen, CodeFragment } from 'ui/Content.es6';
import {
  CopyButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tag,
  TextLink
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import QuestionMarkIcon from 'svg/QuestionMarkIcon.es6';
import Icon from 'ui/Components/Icon.es6';
import { Tooltip } from '@contentful/forma-36-react-components';
import DocumentTitle from 'components/shared/DocumentTitle.es6';

export default function View({ state, actions }) {
  return (
    <React.Fragment>
      <DocumentTitle title="Environments" />
      <Workbench>
        <Workbench.Header icon={<Icon name="page-settings" scale="0.8" />} title="Environments" />
        <Workbench.Content type="full">
          <EnvironmentList {...state} {...actions} />
        </Workbench.Content>
        <Workbench.Sidebar position="right">
          <Sidebar {...state} {...actions} />
        </Workbench.Sidebar>
      </Workbench>
    </React.Fragment>
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

const copyButtonStyleOverride = css({
  button: {
    backgroundColor: 'transparent',
    border: 'none',
    height: '1.7em',
    width: '2em',
    '&:hover': {
      backgroundColor: 'transparent'
    }
  }
});

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
            <TableRow key={environment.id} testId={`environment.${environment.id}`}>
              <TableCell>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CodeFragment key="environment-code-fragment">{environment.id}</CodeFragment>
                  <div style={{ display: 'inline-block', marginLeft: '6px' }} />
                  <CopyButton className={copyButtonStyleOverride} copyValue={environment.id} />
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
  const hasAliases = environment.aliases.length > 0;

  const content = (
    <TextLink
      linkType="negative"
      testId="openDeleteDialog"
      disabled={environment.isMaster || hasAliases}
      onClick={environment.Delete}>
      Delete
    </TextLink>
  );

  if (!hasAliases) return content;

  const tooltipContent = (
    <div>
      You cannot delete {`"${environment.id}"`}
      <br />
      as it is aliased to {`"${environment.aliases.join('", "')}"`}.
    </div>
  );

  return (
    <Tooltip content={tooltipContent} place="top" style={{ color: tokens.colorElementDarkest }}>
      {content}
    </Tooltip>
  );
}
DeleteButton.propTypes = {
  environment: PropTypes.object.isRequired
};

function Sidebar({
  canCreateEnv,
  resource,
  isLegacyOrganization,
  canUpgradeSpace,
  OpenCreateDialog,
  OpenUpgradeSpaceDialog
}) {
  // Master is not included in the api, display +1 usage and limit
  const usage = resource.usage + 1;
  const limit = get(resource, 'limits.maximum', -1) + 1;

  return (
    <>
      <h2 className="entity-sidebar__heading" style={{ marginTop: 0 }}>
        Usage
      </h2>
      <div className="entity-sidebar__text-profile">
        <p data-test-id="environmentsUsage">
          You are using {usage}{' '}
          {limit ? `out of ${limit} environments available ` : pluralize('environment', usage)} in
          this space.
          {!isLegacyOrganization && <UsageTooltip resource={resource} />}
        </p>
        {!canCreateEnv && !isLegacyOrganization && (
          <p>
            {limit > 1 && 'Delete existing environments or '}
            {canUpgradeSpace &&
              (limit > 1 ? 'change the space to add more' : 'Change change the space to add more')}
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
        {!canCreateEnv && !isLegacyOrganization && canUpgradeSpace && (
          <UpgradeButton OpenUpgradeSpaceDialog={OpenUpgradeSpaceDialog} />
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
    </>
  );
}
Sidebar.propTypes = {
  canCreateEnv: PropTypes.bool,
  resource: PropTypes.object,
  organizationId: PropTypes.string,
  isLegacyOrganization: PropTypes.bool,
  canUpgradeSpace: PropTypes.bool,
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
      content={tooltipContent}
      place="bottom"
      style={{
        color: tokens.colorElementDarkest,
        marginLeft: '0.2em'
      }}>
      <span data-test-id="environments-usage-tooltip">
        <Icon name="question-mark" />
      </span>
    </Tooltip>
  );
}

UsageTooltip.propTypes = {
  resource: PropTypes.object.isRequired
};

function UpgradeButton({ OpenUpgradeSpaceDialog }) {
  return (
    <button
      data-test-id="openUpgradeDialog"
      onClick={() => OpenUpgradeSpaceDialog()}
      className="btn-action x--block">
      Upgrade space
    </button>
  );
}

UpgradeButton.propTypes = {
  OpenUpgradeSpaceDialog: PropTypes.func.isRequired
};
