import React from 'react';
import PropTypes from 'prop-types';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import SidepanelOrgs from './SidepanelOrgs';
import SidepanelSpaces from './SidepanelSpaces';
import SidepanelNoOrgs from './SidepanelNoOrgs';
import OrgActions from './OrgActions';
import * as Navigator from 'states/Navigator';
import * as OrgRoles from 'services/OrganizationRoles';
import * as CreateSpace from 'services/CreateSpace';
import { get } from 'lodash';
import * as K from 'core/utils/kefir';
import * as TokenStore from 'services/TokenStore';
import * as accessChecker from 'access_control/AccessChecker/index';
import * as logger from 'services/logger';
import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { navState$ } from 'navigation/NavState';
import { isOrganizationOnTrial } from 'features/trials';

export default class Sidepanel extends React.Component {
  static propTypes = {
    sidePanelIsShown: PropTypes.bool,
    closeOrgsDropdown: PropTypes.func,
    closeSidePanel: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      initialized: false,
      viewingOrgSettings: false,
      currOrg: null,
      orgs: [],
      spacesByOrg: {},
      openedSpaceId: null,
      environmentsEnabled: false,
      isSpaceCreateForSpacePlanEnabled: false,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.sidePanelIsShown === false && this.props.sidePanelIsShown === true) {
      this.initializeSidebar();
    }
  }

  async initializeSidebar() {
    const [orgs, spacesByOrg, navState] = await Promise.all([
      K.getValue(TokenStore.organizations$),
      K.getValue(TokenStore.spacesByOrganization$),
      K.getValue(navState$),
    ]);

    const currentSpaceId = get(navState, ['space', 'sys', 'id']);
    const currentEnvId = get(navState, ['env', 'sys', 'id'], 'master');
    const currentAliasId = get(navState, ['environmentMeta', 'aliasId'], null);
    const org = navState.org || orgs[0];
    const currentOrgId = get(org, ['sys', 'id']);

    const environmentsEnabled = await getVariation(FLAGS.ENVIRONMENTS_FLAG, {
      spaceId: currentSpaceId,
      organizationId: currentOrgId,
    });

    const isSpaceCreateForSpacePlanEnabled = await getVariation(FLAGS.CREATE_SPACE_FOR_SPACE_PLAN);

    this.setState(
      {
        orgs: orgs || [],
        spacesByOrg: spacesByOrg || {},
        currentSpaceId,
        currentEnvId,
        currentAliasId,
        environmentsEnabled,
        isSpaceCreateForSpacePlanEnabled,
      },
      () => {
        this.setCurrOrg(org);
      }
    );
  }

  setCurrOrg = (org) => {
    const updates = {
      initialized: true,
    };

    const orgId = get(org, ['sys', 'id']);

    // Collapse environment list if changing organization
    if (get(this.state, ['currOrg', 'sys', 'id']) !== orgId) {
      updates.openedSpaceId = null;
    }

    updates.canCreateSpaceInCurrOrg = accessChecker.canCreateSpaceInOrganization(orgId);
    updates.canCreateOrg = accessChecker.canCreateOrganization();
    updates.currOrg = org;

    this.setState(updates);
  };

  gotoOrgSettings = () => {
    this.props.closeSidePanel();
    const orgSettingsPath = ['account', 'organizations'];
    if (OrgRoles.isOwnerOrAdmin(this.state.currOrg) || isOrganizationOnTrial(this.state.currOrg)) {
      const hasNewPricing = this.state.currOrg.pricingVersion === 'pricing_version_2';
      orgSettingsPath.push(hasNewPricing ? 'subscription_new' : 'subscription');
    } else {
      orgSettingsPath.push('teams');
    }

    const orgId = this.state.currOrg.sys.id;

    Navigator.go({
      path: orgSettingsPath,
      params: { orgId },
    });
  };

  goToSpace = (spaceId, envId, isMaster) => {
    envId = isMaster ? undefined : envId;
    const path = ['spaces', 'detail'].concat(envId ? ['environment'] : []);

    this.props.closeSidePanel();

    Navigator.go({
      path,
      params: {
        spaceId,
        environmentId: envId,
      },
      options: { reload: true },
    }).catch((err) => {
      // Collapse environment list if navigation failed
      // e.g. when environment was deleted
      this.setState({ openedSpaceId: null });
      logger.logException(err);
    });
  };

  createNewOrg = () => {
    this.props.closeSidePanel();
    Navigator.go({
      path: ['account', 'new_organization'],
    });
  };

  showCreateSpaceModal = () => {
    const organizationId = this.state.currOrg.sys.id;

    trackCTAClick(CTA_EVENTS.CREATE_SPACE, {
      organizationId,
      ctaLocation: 'sidepanel',
    });

    this.props.closeSidePanel();
    CreateSpace.beginSpaceCreation(organizationId);
  };

  setOpenedSpaceId = (spaceId) => {
    this.setState({ openedSpaceId: spaceId });
  };

  render() {
    const { sidePanelIsShown, closeOrgsDropdown } = this.props;

    return (
      <div
        className={`nav-sidepanel ${sidePanelIsShown ? 'nav-sidepanel--is-active' : ''}`}
        aria-hidden={sidePanelIsShown ? 'false' : 'true'}
        onClick={closeOrgsDropdown}
        data-test-id="sidepanel">
        {this.state.currOrg && this.state.initialized && (
          <React.Fragment>
            <SidepanelOrgs
              {...this.props}
              {...this.state}
              createNewOrg={this.createNewOrg}
              setCurrOrg={this.setCurrOrg}
            />
            <SidepanelSpaces
              {...this.props}
              {...this.state}
              showCreateSpaceModal={this.showCreateSpaceModal}
              goToSpace={this.goToSpace}
              setOpenedSpaceId={this.setOpenedSpaceId}
              isSpaceCreateForSpacePlanEnabled={this.state.isSpaceCreateForSpacePlanEnabled}
            />
            <OrgActions
              gotoOrgSettings={this.gotoOrgSettings}
              showSubscriptionSettings={isOwnerOrAdmin(this.state.currOrg)}
            />
          </React.Fragment>
        )}
        {!this.state.currOrg && this.state.initialized && (
          <SidepanelNoOrgs createNewOrg={this.createNewOrg} />
        )}
      </div>
    );
  }
}
