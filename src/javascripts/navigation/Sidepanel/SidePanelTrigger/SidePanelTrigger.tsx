/* eslint-disable camelcase, rulesdir/restrict-non-f36-components */
import React from 'react';
import cn from 'classnames';

import Hamburger from 'svg/hamburger.svg';
import EnvOrAliasLabel from 'app/common/EnvOrAliasLabel';
import { styles } from './SidePanelTrigger.styles';
import { AppNavLogo } from '@contentful/experience-components';

interface TriggerProps {
  triggerText?: React.ReactNode;
  onClickOrganization: React.MouseEventHandler;
  openAppSwitcher?: () => void;
  testId?: string;
}

type environmentMetaProps = {
  environmentId?: string;
  aliasId?: string;
  isMasterEnvironment?: boolean;
};

const TriggerIcon = ({ openAppSwitcher }: { openAppSwitcher?: () => void }) => {
  const onClick: React.MouseEventHandler = (event) => {
    event.stopPropagation();
    openAppSwitcher?.();
  };
  return (
    <AppNavLogo
      label="Switch Contentful app"
      showTooltip={false}
      onClick={onClick}
      className={styles.noBorder}
    />
  );
};

export const SidePanelTrigger = ({
  onClickOrganization,
  openAppSwitcher,
  testId = 'sidepanel-trigger',
  triggerText,
}: TriggerProps) => {
  return (
    <div
      className={styles.root}
      onClick={onClickOrganization}
      data-ui-tour-step="sidepanel-trigger"
      data-test-id={testId}>
      <ul className={styles.noShrink}>
        <TriggerIcon openAppSwitcher={openAppSwitcher} />
      </ul>
      <button
        className={styles.content}
        aria-label="Switch Space/Organization"
        aria-current="location"
        aria-live="polite">
        {triggerText}
      </button>
      <div className={styles.hoverBackground} />
      <Hamburger className={styles.noShrink} fill={'white'} />
    </div>
  );
};

export const StateTitle = ({ title }: { title: string }) => {
  const componentClassNames = cn(styles.ellipsis, styles.stateTitle);
  return (
    <strong key={title} data-test-id="sidepanel-trigger-text-title" className={componentClassNames}>
      {title}
    </strong>
  );
};

export const OrganizationName = ({ name }: { name: string }) => {
  const componentClassNames = cn(styles.ellipsis, styles.orgName);
  return (
    <small
      key={name}
      data-test-id="sidepanel-trigger-text-subtitle"
      className={componentClassNames}>
      {name}
    </small>
  );
};

export const EnvironmentLabel = ({
  environmentMeta,
}: {
  environmentMeta: environmentMetaProps;
}) => {
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
