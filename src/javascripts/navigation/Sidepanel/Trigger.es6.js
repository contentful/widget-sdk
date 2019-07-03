/* eslint-disable camelcase */

import React from 'react';
import PropTypes from 'prop-types';
import { caseof } from 'sum-types';
import tokens from '@contentful/forma-36-tokens';

import Logo from 'svg/logo-label.es6';
import EnvironmentIcon from 'svg/environment.es6';
import Hamburger from 'svg/hamburger.es6';

import { navState$, NavStates } from 'navigation/NavState.es6';
import * as TokenStore from 'services/TokenStore.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import { getModule } from 'NgRegistry.es6';
const spaceContext = getModule('spaceContext');

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
        <div className="f36-margin-left--m" />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignSelf: 'stretch',
            flexGrow: '1',
            flexShrink: '1',
            overflow: 'hidden'
          }}>
          {renderContent(this.state)}
        </div>
        <div className="f36-margin-left--m" />
        <Hamburger fill={'white'} />
      </div>
    );
  }
}

function renderContent({ navState, showOrganization }) {
  return caseof(navState, [
    [
      NavStates.Space,
      ({ space, env, org, availableEnvironments }) => {
        const canManageEnvs = accessChecker.can('manage', 'Environments');
        const hasManyEnvs = (availableEnvironments || []).length > 1;
        const showEnvironments = canManageEnvs && hasManyEnvs;

        return [
          showOrganization && organizationName(org.name),
          stateTitle(space.name),
          showEnvironments && environmentLabel(env)
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
    [
      NavStates.Projects,
      ({ org }) => [showOrganization && organizationName(org.name), stateTitle('Project')]
    ],
    [NavStates.Projects, () => [stateTitle('Project')]],
    [NavStates.Default, () => [stateTitle('Welcome to Contentful')]]
  ]);
}

function stateTitle(title) {
  return (
    <div
      key={title}
      data-test-id="sidepanel-trigger-text-title"
      style={{
        ...oneLineTruncate,
        color: '#fff',
        fontSize: '14px',
        lineHeight: '1.3'
      }}>
      {title}
    </div>
  );
}

function organizationName(orgName) {
  return (
    <div
      key={orgName}
      data-test-id="sidepanel-trigger-text-subtitle"
      style={{
        ...oneLineTruncate,
        color: tokens.colorTextLight,
        fontSize: '12px',
        lineHeight: '1.5'
      }}>
      {orgName}
    </div>
  );
}

function environmentLabel(env) {
  // TODO The 'Space' nav state should always have an environment
  const envId = env ? env.sys.id : 'master';
  const isMaster = env ? spaceContext.isMasterEnvironment(env) : true;
  return (
    <div
      key={envId}
      style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '12px',
        lineHeight: '1.5',
        color: isMaster ? tokens.colorGreenLight : tokens.colorOrangeLight
      }}>
      <EnvironmentIcon
        style={{
          display: 'block',
          flexShrink: 0,
          fill: 'currentColor'
        }}
      />
      <div className="f36-margin-left--s" />
      <div
        style={{
          ...oneLineTruncate
        }}>
        {envId}
      </div>
    </div>
  );
}
