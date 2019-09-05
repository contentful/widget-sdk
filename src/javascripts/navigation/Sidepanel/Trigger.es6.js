/* eslint-disable camelcase */

import React from 'react';
import PropTypes from 'prop-types';
import { caseof } from 'sum-types';
import tokens from '@contentful/forma-36-tokens';

import Logo from 'svg/logo-label.es6';
import Hamburger from 'svg/hamburger.es6';

import { navState$, NavStates } from 'navigation/NavState.es6';
import * as TokenStore from 'services/TokenStore.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import EnvOrAliasLabel from 'app/common/EnvOrAliasLabel.es6';
import { css } from 'emotion';

const oneLineTruncate = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis'
};

export default class Trigger extends React.Component {
  static propTypes = {
    onClick: PropTypes.func.isRequired
  };

  UNSAFE_componentWillMount() {
    this.offNavState = navState$.onValue(navState => {
      this.setState({ navState });
    });
    this.offOrganizations = TokenStore.organizations$.onValue(organizations => {
      this.setState({ showOrganization: organizations.length > 1 });
    });
  }

  componentWillUnmount() {
    this.offNavState();
  }

  render() {
    const { onClick } = this.props;
    return (
      <div
        className="app-top-bar__sidepanel-trigger"
        onClick={onClick}
        data-ui-tour-step="sidepanel-trigger"
        data-test-id="sidepanel-trigger">
        <Logo />
        <div
          className={css({
            marginLeft: tokens.spacingM
          })}
        />
        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignSelf: 'stretch',
            flexGrow: '1',
            flexShrink: '1',
            overflow: 'hidden'
          })}>
          {renderContent(this.state)}
        </div>
        <div
          className={css({
            marginLeft: tokens.spacingM
          })}
        />
        <Hamburger fill={'white'} />
      </div>
    );
  }
}

function renderContent({ navState, showOrganization }) {
  return caseof(navState, [
    [
      NavStates.Space,
      ({ space, org, availableEnvironments = [], environmentMeta = {} }) => {
        const canManageEnvs = accessChecker.can('manage', 'Environments');
        const hasManyEnvs = availableEnvironments.length > 1;
        const showEnvironments = canManageEnvs && (hasManyEnvs || environmentMeta.aliasId);
        return [
          showOrganization && organizationName(org.name),
          stateTitle(space.name),
          showEnvironments && environmentLabel(environmentMeta)
        ];
      }
    ],
    [
      NavStates.OrgSettings,
      ({ org }) => [
        showOrganization && organizationName(org.name),
        stateTitle('Organization settings')
      ]
    ],
    [NavStates.NewOrg, () => [stateTitle('Create new organization')]],
    [NavStates.UserProfile, () => [stateTitle('User profile')]],
    [NavStates.Default, () => [stateTitle('Welcome to Contentful')]]
  ]);
}

function stateTitle(title) {
  return (
    <div
      key={title}
      data-test-id="sidepanel-trigger-text-title"
      className={css({
        ...oneLineTruncate,
        color: '#fff',
        fontSize: '14px',
        lineHeight: '1.3'
      })}>
      {title}
    </div>
  );
}

function organizationName(orgName) {
  return (
    <div
      key={orgName}
      data-test-id="sidepanel-trigger-text-subtitle"
      className={css({
        ...oneLineTruncate,
        color: tokens.colorTextLight,
        fontSize: '12px',
        lineHeight: '1.5'
      })}>
      {orgName}
    </div>
  );
}

function environmentLabel(environmentMeta) {
  if (!environmentMeta || !environmentMeta.environmentId) return null;

  const { environmentId, aliasId, isMasterEnvironment } = environmentMeta;

  return (
    <EnvOrAliasLabel
      key={environmentId}
      className={css({ fontSize: tokens.fontSizeS })}
      aliasId={aliasId}
      environmentId={aliasId || environmentId}
      isMaster={isMasterEnvironment}
      showAliasedTo={false}
      isSelected
      colorizeFont
    />
  );
}
