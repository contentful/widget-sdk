import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { css } from 'emotion';
import { caseofEq } from 'sum-types';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextLink,
  Tag,
  Tooltip,
  DisplayText,
  SkeletonContainer,
  SkeletonBodyText,
  Workbench,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import * as Config from 'Config';
import { ENVIRONMENT_CREATION_COMPLETE_EVENT } from 'services/PubSubService';

import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { LinkOpen } from 'ui/Content';
import { assign } from 'utils/Collections';

import EnvironmentAliases from 'app/SpaceSettings/EnvironmentAliases/EnvironmentAliases';
import EnvironmentDetails from 'app/common/EnvironmentDetails';
import DocumentTitle from 'components/shared/DocumentTitle';
import { useEnvironmentsRouteState } from './EnvironmentsRouteReducer';
import { EnvironmentsSidebar } from '../components/EnvironmentsSidebar';

import QuestionMarkIcon from 'svg/QuestionMarkIcon.svg';
import AliasIcon from 'svg/alias.svg';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { go } from 'states/Navigator';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { usePubSubClient } from 'core/hooks';

export function EnvironmentsRoute() {
  const {
    currentSpaceId,
    currentEnvironmentId,
    currentEnvironmentAliasId,
    currentOrganizationId,
    currentOrganization,
    currentSpaceData,
  } = useSpaceEnvContext();
  const spacePubSubClient = usePubSubClient();
  const [
    state,
    { FetchPermissions, FetchEnvironments, FetchNextSpacePlan, RefetchEnvironments, ...actions },
  ] = useEnvironmentsRouteState({
    canUpgradeSpace: isOwnerOrAdmin(currentOrganization),
    currentAliasId: currentEnvironmentAliasId,
    environmentId: currentEnvironmentId,
    getSpaceData: () => currentSpaceData,
    goToSpaceDetail: () => go({ path: 'spaces.detail' }),
    organizationId: currentOrganizationId,
    pubsubClient: spacePubSubClient,
    spaceId: currentSpaceId,
  });
  const { aliasesEnabled, canManageAliases, hasOptedInEnv, pubsubClient } = state;

  useEffect(() => {
    (async () => {
      await FetchPermissions();
      await FetchEnvironments();
      await FetchNextSpacePlan();
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // top: effect forced to happen only once

  useEffect(() => {
    if (!pubsubClient) {
      return;
    }

    const handler = () => {
      RefetchEnvironments();
    };

    pubsubClient.on(ENVIRONMENT_CREATION_COMPLETE_EVENT, handler);

    return () => {
      pubsubClient.off(ENVIRONMENT_CREATION_COMPLETE_EVENT, handler);
    };
  });

  return (
    <>
      <DocumentTitle title="Environments" />
      <Workbench>
        <Workbench.Header
          icon={<ProductIcon icon="Settings" size="large" />}
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
          <EnvironmentsSidebar {...state} {...actions} />
        </Workbench.Sidebar>
      </Workbench>
    </>
  );
}

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
    flexWrap: 'wrap',
    '& span': {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      whiteSpace: 'nowrap',
    },
    '& span > svg': {
      margin: `0 ${tokens.spacingXs}`,
      fill: tokens.colorPositive,
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
          <TableCell className={css({ width: '5%' })} />
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
                    isMaster={environment.isMaster}
                  />
                  {environment.aliases && environment.aliases[0] && (
                    <span className={environmentTableStyles.aliasedTo}>
                      <span>Aliased to</span>
                      {environment.aliases.map((alias) => (
                        <span key={alias}>
                          <AliasIcon /> {alias}
                        </span>
                      ))}
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
