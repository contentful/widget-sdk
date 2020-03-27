import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import moment from 'moment';
import { css } from 'emotion';
import { get } from 'lodash';
import * as Config from 'Config';
import { assign } from 'utils/Collections';
import { caseofEq } from 'sum-types';
import AliasIcon from 'svg/alias.svg';
import { LinkOpen } from 'ui/Content';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextLink,
  Tag,
  DisplayText,
  Heading,
  Paragraph,
  Button,
  SkeletonContainer,
  SkeletonBodyText,
  Workbench,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import QuestionMarkIcon from 'svg/QuestionMarkIcon.svg';
import Icon from 'ui/Components/Icon';
import NavigationIcon from 'ui/Components/NavigationIcon';

import { Tooltip } from '@contentful/forma-36-react-components';
import DocumentTitle from 'components/shared/DocumentTitle';
import EnvironmentAliases from 'app/SpaceSettings/EnvironmentAliases/EnvironmentAliases';
import EnvironmentDetails from 'app/common/EnvironmentDetails';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { useEnvironmentsRouteState } from './EnvironmentsRouteReducer';
import { ENVIRONMENT_CREATION_COMPLETE_EVENT } from 'services/PubSubService';

export default function EnvironmentsRoute(props) {
  const [
    state,
    { FetchPermissions, FetchEnvironments, RefetchEnvironments, ...actions },
  ] = useEnvironmentsRouteState(props);

  const { aliasesEnabled, canManageAliases, hasOptedInEnv, pubsubClient } = state;

  useEffect(() => {
    (async () => {
      await FetchPermissions();
      await FetchEnvironments();
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // top: effect forced to happen only once

  useEffect(() => {
    const handler = () => {
      RefetchEnvironments();
    };

    pubsubClient.on(ENVIRONMENT_CREATION_COMPLETE_EVENT, handler);

    return () => {
      pubsubClient.off(ENVIRONMENT_CREATION_COMPLETE_EVENT, handler);
    };
  });

  return (
    <Fragment>
      <DocumentTitle title="Environments" />
      <Workbench>
        <Workbench.Header
          icon={<NavigationIcon icon="settings" color="green" size="large" />}
          title="Environments"
        />
        <Workbench.Content>
          {aliasesEnabled && canManageAliases && (
            <EnvironmentAliases {...state} {...actions} testId="environmentaliases.card" />
          )}
          {aliasesEnabled && hasOptedInEnv && (
            <DisplayText
              testId="environments.header"
              className={css({
                fontSize: tokens.fontSizeS,
                textTransform: 'uppercase',
                marginBottom: tokens.spacingM,
                color: tokens.colorTextMid,
              })}
              element="h2">
              Environments
            </DisplayText>
          )}
          <EnvironmentList {...state} {...actions} />
        </Workbench.Content>
        <Workbench.Sidebar position="right">
          <Sidebar {...state} {...actions} />
        </Workbench.Sidebar>
      </Workbench>
    </Fragment>
  );
}

EnvironmentsRoute.propTypes = {
  endpoint: PropTypes.func.isRequired,
  getSpaceData: PropTypes.func.isRequired,
  getAliasesIds: PropTypes.func.isRequired,
  goToSpaceDetail: PropTypes.func.isRequired,
  isMasterEnvironment: PropTypes.func.isRequired,
  spaceId: PropTypes.string.isRequired,
  organizationId: PropTypes.string.isRequired,
  currentEnvironmentId: PropTypes.string.isRequired,
  canUpgradeSpace: PropTypes.bool.isRequired,
  isLegacyOrganization: PropTypes.bool.isRequired,
  pubsubClient: PropTypes.object.isRequired,
};

const environmentListStyles = {
  wrapper: css({
    position: 'relative',
    minHeight: '6em',
    '& > div': {
      zIndex: 1,
    },
  }),
};
/**
 * Renders
 * - A loading indicator
 * - The item table
 * - A paginator for the items
 * - A warning message if loading the items failed
 */
function EnvironmentList({ isLoading, loadingError, items, OpenDeleteDialog }) {
  const environments = items.map((env) =>
    assign(env, {
      Delete: () => OpenDeleteDialog(env),
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
      <div className={environmentListStyles.wrapper}>
        {isLoading ? (
          <SkeletonContainer
            testId="environments-loader"
            ariaLabel="Loading environments list"
            svgWidth="100%">
            <SkeletonBodyText numberOfLines={5} />
          </SkeletonContainer>
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
};

const IN_PROGRESS_TOOLTIP = [
  'This environment is currently being created, it will take a couple ',
  'of minutes. You can leave this page as it’s happening in the background.',
].join('');

const FAILED_TOOLTIP = [
  'Something went wrong with the creation this environment. Try to ',
  'delete it and create it again, if that doesn’t work contact support.',
].join('');

const environmentTableStyles = {
  tableRow: css({
    '& > td': {
      verticalAlign: 'middle',
    },
  }),
  firstCell: css({
    display: 'flex',
    alignItems: 'center',
  }),
  aliasedTo: css({
    fontStyle: 'italic',
    whiteSpace: 'nowrap',
    paddingLeft: tokens.spacingL,
    display: 'flex',
    alignItems: 'center',
    '& > svg': {
      margin: `0 ${tokens.spacingXs}`,
      fill: tokens.colorGreenLight,
    },
  }),
  createdAtCell: css({
    whiteSpace: 'nowrap',
    '&:first-letter': { textTransform: 'capitalize' },
  }),
  actionCell: css({
    textAlign: 'right',
    '& button': {
      whiteSpace: 'nowrap',
    },
  }),
};

function EnvironmentTable({ environments }) {
  if (environments.length === 0) {
    return <div />;
  }

  return (
    <Table testId="environment-table">
      <TableHead>
        <TableRow>
          <TableCell className={css({ width: '40%' })}>Environment ID</TableCell>
          <TableCell className={css({ width: '25%' })}>Created</TableCell>
          <TableCell className={css({ width: '20%' })}>Status</TableCell>
          <TableCell className={css({ width: '5%' })}></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {environments
          .sort((envA, envB) => envB.isMaster - envA.isMaster)
          .map((environment) => {
            return (
              <TableRow
                key={environment.id}
                className={environmentTableStyles.tableRow}
                testId={`environment.${environment.id}`}>
                <TableCell className={environmentTableStyles.firstCell}>
                  <EnvironmentDetails
                    environmentId={environment.id}
                    isMaster={environment.isMaster}></EnvironmentDetails>
                  {environment.isMaster && environment.aliases && environment.aliases[0] && (
                    <span className={environmentTableStyles.aliasedTo}>
                      <span>Aliased to</span>
                      <AliasIcon></AliasIcon> {environment.aliases[0]}
                    </span>
                  )}
                </TableCell>
                <TableCell className={environmentTableStyles.createdAtCell}>
                  {moment(environment.payload.sys.createdAt).fromNow()}
                </TableCell>
                <TableCell testId="view.status">
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
                      },
                    ],
                    [
                      'failed',
                      () => {
                        return (
                          <Tag tagType="negative">
                            Failed to create {QuestionMarkWithTooltip({ tooltip: FAILED_TOOLTIP })}
                          </Tag>
                        );
                      },
                    ],
                  ])}
                </TableCell>
                <TableCell className={environmentTableStyles.actionCell}>
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
  environments: PropTypes.array,
};

function QuestionMarkWithTooltip({ tooltip }) {
  return (
    <span title={tooltip} className={css({ cursor: 'pointer', paddingLeft: '10px' })}>
      <QuestionMarkIcon />
    </span>
  );
}
QuestionMarkWithTooltip.propTypes = {
  tooltip: PropTypes.string.isRequired,
};

function DeleteButton({ environment }) {
  const hasAliases = environment.aliases.length > 0;
  const isDisabled = environment.isMaster || hasAliases;

  const reason = hasAliases
    ? `aliased to "${environment.aliases.join('", "')}".`
    : 'your default environment.';

  const content = (
    <TextLink
      onClick={environment.Delete}
      linkType="negative"
      testId="openDeleteDialog"
      disabled={isDisabled}>
      Delete
    </TextLink>
  );

  if (!isDisabled) {
    return content;
  }

  const tooltipContent = (
    <div>
      You cannot delete {`"${environment.id}"`}
      <br />
      {`as it is ${reason}`}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} place="top">
      {content}
    </Tooltip>
  );
}

DeleteButton.propTypes = {
  environment: PropTypes.object.isRequired,
};

const sidebarStyles = {
  subHeaderFirst: css({
    fontSize: tokens.fontSizeM,
    paddingBottom: tokens.spacingXs,
    color: tokens.colorTextDark,
  }),
  subHeader: css({
    fontSize: tokens.fontSizeM,
    paddingTop: tokens.spacingL,
    paddingBottom: tokens.spacingXs,
    color: tokens.colorTextDark,
  }),
  paragraph: css({
    marginBottom: tokens.spacingM,
  }),
};

const envDocSidebarUtmParams =
  '?utm_source=webapp&utm_medium=environments-sidebar&utm_campaign=in-app-help';

const docLinks = {
  domainModelConcepts: `${Config.developerDocsUrl}/concepts/domain-model/${envDocSidebarUtmParams}`,
  envAliasesConcepts: `${Config.developerDocsUrl}/concepts/environment-aliases/${envDocSidebarUtmParams}`,
};

function Sidebar({
  canCreateEnv,
  resource,
  isLegacyOrganization,
  canUpgradeSpace,
  OpenCreateDialog,
  OpenUpgradeSpaceDialog,
  aliasesEnabled,
  canManageAliases,
  hasOptedInEnv,
}) {
  // Master is not included in the api, display +1 usage and limit
  const usage = resource.usage + 1;
  const limit = get(resource, 'limits.maximum', -1) + 1;
  const shouldShowAliasDefinition = canManageAliases || hasOptedInEnv;

  return (
    <>
      <Heading element="h2" className={`${css({ marginTop: 0 })} entity-sidebar__heading`}>
        Usage
      </Heading>
      <div className="entity-sidebar__text-profile">
        <Paragraph testId="environmentsUsage">
          You are using {usage}{' '}
          {limit ? `out of ${limit} environments available ` : pluralize('environment', usage)} in
          this space.
          {!isLegacyOrganization && <UsageTooltip resource={resource} />}
        </Paragraph>
        {!canCreateEnv && !isLegacyOrganization && (
          <Paragraph>
            {limit > 1 && 'Delete existing environments or '}
            {canUpgradeSpace &&
              (limit > 1 ? 'change the space to add more' : 'Change change the space to add more')}
            {!canUpgradeSpace &&
              `${
                limit > 1 ? 'ask' : 'Ask'
              } the administrator of your organization to change the space to add more. `}
          </Paragraph>
        )}
      </div>
      <div className="entity-sidebar__widget">
        {canCreateEnv && (
          <Button isFullWidth testId="openCreateDialog" onClick={OpenCreateDialog}>
            Add environment
          </Button>
        )}
        {!canCreateEnv && !isLegacyOrganization && canUpgradeSpace && (
          <UpgradeButton OpenUpgradeSpaceDialog={OpenUpgradeSpaceDialog} />
        )}
      </div>
      <Heading element="h2" className="entity-sidebar__heading">
        Documentation
      </Heading>
      <Paragraph className={sidebarStyles.subHeaderFirst}>Environment</Paragraph>
      <div className="entity-sidebar__text-profile">
        <Paragraph>
          Environments allow you to develop and test changes to data in isolation.
        </Paragraph>
        <Paragraph>
          See the{' '}
          <ExternalTextLink href={docLinks.domainModelConcepts}>
            Contentful domain model
          </ExternalTextLink>{' '}
          for details.
        </Paragraph>
      </div>
      {aliasesEnabled && shouldShowAliasDefinition && (
        <Fragment>
          <Paragraph className={sidebarStyles.subHeader}>Environment Aliases</Paragraph>
          <div className="entity-sidebar__text-profile">
            <Paragraph>
              An environment alias allows you to access and modify the data of an environment
              through a different static identifier.
            </Paragraph>
            <Paragraph>
              Read our{' '}
              <ExternalTextLink href={docLinks.envAliasesConcepts}>
                environment alias documentation
              </ExternalTextLink>{' '}
              for more information.
            </Paragraph>
          </div>
        </Fragment>
      )}
    </>
  );
}
Sidebar.propTypes = {
  canCreateEnv: PropTypes.bool,
  aliasesEnabled: PropTypes.bool,
  resource: PropTypes.object,
  organizationId: PropTypes.string,
  isLegacyOrganization: PropTypes.bool,
  canUpgradeSpace: PropTypes.bool,
  OpenCreateDialog: PropTypes.func.isRequired,
  OpenUpgradeSpaceDialog: PropTypes.func.isRequired,
  canManageAliases: PropTypes.bool.isRequired,
  hasOptedInEnv: PropTypes.bool.isRequired,
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
      targetWrapperClassName={css({
        marginLeft: tokens.spacingXs,
      })}
      className={css({
        color: tokens.colorElementDarkest,
      })}>
      <span data-test-id="environments-usage-tooltip">
        <Icon name="question-mark" />
      </span>
    </Tooltip>
  );
}

UsageTooltip.propTypes = {
  resource: PropTypes.object.isRequired,
};

function UpgradeButton({ OpenUpgradeSpaceDialog }) {
  return (
    <Button isFullWidth testId="openUpgradeDialog" onClick={() => OpenUpgradeSpaceDialog()}>
      Upgrade space
    </Button>
  );
}

UpgradeButton.propTypes = {
  OpenUpgradeSpaceDialog: PropTypes.func.isRequired,
};
