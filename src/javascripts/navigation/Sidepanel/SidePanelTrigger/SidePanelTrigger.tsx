/* eslint-disable camelcase, rulesdir/restrict-non-f36-components */
import React, { useState, useEffect } from 'react';
import { caseof } from 'sum-types';
import cn from 'classnames';

import * as accessChecker from 'access_control/AccessChecker';
import * as TokenStore from 'services/TokenStore';

import Logo from 'svg/logo-label.svg';
import * as K from 'core/utils/kefir';
import Hamburger from 'svg/hamburger.svg';
import { navState$, NavStates } from 'navigation/NavState';
import EnvOrAliasLabel from 'app/common/EnvOrAliasLabel';
import { styles } from './SidePanelTrigger.styles';

interface Props {
  onClick: React.MouseEventHandler;
  testId?: string;
}

type OrganizationProps = {
  name: string;
};

type environmentMetaProps = {
  environmentId?: string;
  aliasId?: string;
  isMasterEnvironment?: boolean;
};

export const SidePanelTrigger = ({ onClick, testId = 'sidepanel-trigger' }: Props) => {
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
    <button
      className={styles.root}
      onClick={onClick}
      data-ui-tour-step="sidepanel-trigger"
      data-test-id={testId}
      aria-label="Switch Space/Organization">
      <Logo />
      <div className={styles.content} aria-current="location" aria-live="polite">
        {navState && renderContent({ navState, showOrganization })}
      </div>
      <Hamburger fill={'white'} />
    </button>
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
