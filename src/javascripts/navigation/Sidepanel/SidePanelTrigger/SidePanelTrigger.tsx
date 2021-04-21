/* eslint-disable camelcase, rulesdir/restrict-non-f36-components */
import React, { useState, useEffect } from 'react';
import { caseof } from 'sum-types';
import cn from 'classnames';

import * as accessChecker from 'access_control/AccessChecker';
import * as TokenStore from 'services/TokenStore';

import ContentfulLogo from 'svg/logo-label.svg';
import AppGridIcon from 'svg/app-grid-icon.svg';
import * as K from 'core/utils/kefir';
import Hamburger from 'svg/hamburger.svg';
import { navState$, NavStates } from 'navigation/NavState';
import EnvOrAliasLabel from 'app/common/EnvOrAliasLabel';
import { styles } from './SidePanelTrigger.styles';
import { AppNavLogo } from '@contentful/experience-components';
import { SkeletonContainer, SkeletonImage } from '@contentful/forma-36-react-components';

interface Props {
  onClickOrganization: React.MouseEventHandler;
  openAppSwitcher?: () => void;
  testId?: string;
  showIcon?: boolean;
  // null meaning that the flag isn't yet loaded;
  hasContentfulApps: boolean | null;
}

type OrganizationProps = {
  name: string;
};

type environmentMetaProps = {
  environmentId?: string;
  aliasId?: string;
  isMasterEnvironment?: boolean;
};

const TriggerIcon = ({
  hasContentfulApps,
  openAppSwitcher,
}: {
  hasContentfulApps: boolean | null;
  openAppSwitcher?: () => void;
}) => {
  const onClick: React.MouseEventHandler = (event) => {
    event.stopPropagation();
    openAppSwitcher?.();
  };
  const appSwitcherIconWidth = 40;

  if (hasContentfulApps === true) {
    return (
      <button aria-label="Switch Contentful app" data-test-id="sidepanel-trigger-apps">
        <AppGridIcon onClick={onClick} width={appSwitcherIconWidth} height={appSwitcherIconWidth} />
      </button>
    );
  }
  if (hasContentfulApps === false) return <ContentfulLogo />;

  return (
    <SkeletonContainer
      backgroundOpacity={0.25}
      foregroundOpacity={0.25}
      svgWidth={appSwitcherIconWidth}
      svgHeight={appSwitcherIconWidth}>
      <SkeletonImage
        width={appSwitcherIconWidth}
        height={appSwitcherIconWidth}
        radiusX={appSwitcherIconWidth / 2}
        radiusY={appSwitcherIconWidth / 2}
      />
    </SkeletonContainer>
  );
};

export const SidePanelTrigger = ({
  onClickOrganization,
  openAppSwitcher,
  testId = 'sidepanel-trigger',
  hasContentfulApps,
}: Props) => {
  const [navState, setNavState] = useState<unknown>(null);
  const [showOrganization, setShowOrganization] = useState(false);

  useEffect(() => {
    const unsubscribeNavState = K.onValue(navState$, (navState) => {
      setNavState(navState);
    });

    const unsubscribeOrgs = K.onValue(TokenStore.organizations$, (organizations) => {
      const orgs = organizations as OrganizationProps[];
      setShowOrganization(orgs.length > 1);
    });

    return function cleanup() {
      unsubscribeNavState();
      unsubscribeOrgs();
    };
  }, [navState, showOrganization]);

  return (
    <div
      className={styles.root}
      onClick={onClickOrganization}
      data-ui-tour-step="sidepanel-trigger"
      data-test-id={testId}>
      <div className={styles.noShrink}>
        <TriggerIcon openAppSwitcher={openAppSwitcher} hasContentfulApps={hasContentfulApps} />
      </div>
      <button
        className={styles.content}
        aria-label="Switch Space/Organization"
        aria-current="location"
        aria-live="polite">
        {navState && renderContent({ navState, showOrganization })}
      </button>
      <div className={styles.hoverBackground} />
      <Hamburger className={styles.noShrink} fill={'white'} />
    </div>
  );
};

function renderContent({ navState, showOrganization }) {
  return caseof(navState, [
    [
      NavStates.Space,
      ({
        space,
        org,
        availableEnvironments = [],
        environmentMeta = {},
      }: {
        space: { name: string };
        org: { name: string };
        availableEnvironments: unknown[];
        environmentMeta: environmentMetaProps;
      }) => {
        const canManageEnvs = accessChecker.can('manage', 'Environments');
        const hasManyEnvs = availableEnvironments.length > 1;
        const showEnvironments = canManageEnvs && (hasManyEnvs || environmentMeta.aliasId);
        return [
          showOrganization && organizationName(org.name),
          stateTitle(space.name),
          showEnvironments && environmentLabel(environmentMeta),
        ];
      },
    ],
    [
      NavStates.OrgSettings,
      ({ org }) => [
        showOrganization && organizationName(org.name),
        stateTitle('Organization settings'),
      ],
    ],
    [NavStates.NewOrg, () => [stateTitle('Create new organization')]],
    [NavStates.Home, ({ org }) => [showOrganization && organizationName(org.name)]],
    [NavStates.UserProfile, () => [stateTitle('Account settings')]],
    [NavStates.Default, () => [stateTitle('Welcome to Contentful')]],
  ]);
}

const stateTitle = (title) => {
  const componentClassNames = cn(styles.ellipsis, styles.stateTitle);
  return (
    <strong key={title} data-test-id="sidepanel-trigger-text-title" className={componentClassNames}>
      {title}
    </strong>
  );
};

const organizationName = (orgName) => {
  const componentClassNames = cn(styles.ellipsis, styles.orgName);
  return (
    <small
      key={orgName}
      data-test-id="sidepanel-trigger-text-subtitle"
      className={componentClassNames}>
      {orgName}
    </small>
  );
};

const environmentLabel = (environmentMeta: environmentMetaProps) => {
  if (!environmentMeta || !environmentMeta.environmentId) return null;

  const { environmentId, aliasId, isMasterEnvironment } = environmentMeta;

  return (
    <EnvOrAliasLabel
      key={environmentId}
      className={styles.envLabel}
      aliasId={aliasId}
      environmentId={aliasId || environmentId}
      isMaster={isMasterEnvironment}
      showAliasedTo={false}
      isSelected
      colorizeFont
      darkBackground
    />
  );
};
