import React from 'react';
import PropTypes from 'prop-types';
import * as accessChecker from 'access_control/AccessChecker';
import { getCurrentSpaceFeature, getOrgFeature, FEATURES } from 'data/CMA/ProductCatalog';
import NavBar from './NavBar/NavBar';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { getSpaceNavigationItems } from './SpaceNavigationBarItems';
import SidepanelContainer from './Sidepanel/SidepanelContainer';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import {
  getOrganization,
  getOrganizationId,
  getSpaceEnforcements,
  isCurrentEnvironmentMaster,
} from 'core/services/SpaceEnvContext/utils';

// We don't want to display the following sections within the context of
// a sandbox space environment.
const SPACE_SETTINGS_SECTIONS = [
  'settings',
  'users',
  'teams',
  'roles',
  'apiKey',
  'webhooks',
  'previews',
];

export default class SpaceNavigationBar extends React.Component {
  static propTypes = {
    navVersion: PropTypes.number,
  };

  static contextType = SpaceEnvContext;

  constructor(props) {
    super(props);
    this.state = {
      items: [],
    };
  }

  async componentDidMount() {
    this.getConfiguration();
  }

  async componentDidUpdate(prevProps) {
    if (this.props.navVersion !== prevProps.navVersion) {
      this.getConfiguration();
    }
  }

  async getConfiguration() {
    const { currentSpace, currentSpaceId, currentEnvironmentId } = this.context;
    const organization = getOrganization(currentSpace);
    const organizationId = getOrganizationId(currentSpace);

    const [environmentsEnabled, hasOrgTeamFeature, contentTagsEnabled] = await Promise.all([
      getVariation(FLAGS.ENVIRONMENTS_FLAG, {
        organizationId,
        spaceId: currentSpaceId,
        environmentId: currentEnvironmentId,
      }),
      getOrgFeature(organizationId, 'teams'),
      getCurrentSpaceFeature(FEATURES.PC_CONTENT_TAGS),
    ]);

    const canManageEnvironments = accessChecker.can('manage', 'Environments');
    const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
    const usageEnabled = organization.pricingVersion === 'pricing_version_2';
    const canManageSpace = accessChecker.canModifySpaceSettings();

    function canNavigateTo(section) {
      const isSpaceSettingsSection = SPACE_SETTINGS_SECTIONS.includes(section);

      if (isSpaceSettingsSection && !isMasterEnvironment) {
        return false;
      }

      const sectionAvailable = accessChecker.getSectionVisibility()[section];
      const isHibernated = getSpaceEnforcements(currentSpace).some(
        (e) => e.reason === 'hibernated'
      );

      return currentSpace && !isHibernated && sectionAvailable;
    }

    const items = getSpaceNavigationItems({
      canNavigateTo,
      usageEnabled,
      hasOrgTeamFeature,
      useSpaceEnvironment: canManageEnvironments && environmentsEnabled,
      isMasterEnvironment,
      contentTagsEnabled,
      canManageSpace,
    });

    this.setState({ items });
  }

  render() {
    return (
      <>
        <SidepanelContainer />
        <div className="app-top-bar__outer-wrapper">
          <NavBar
            listItems={this.state.items}
            showQuickNavigation
            showModernStackOnboardingRelaunch
          />
        </div>
      </>
    );
  }
}
