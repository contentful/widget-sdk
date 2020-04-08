import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry';
import * as accessChecker from 'access_control/AccessChecker';
import { getCurrentSpaceFeature, getOrgFeature } from 'data/CMA/ProductCatalog';
import { PC_CONTENT_TAGS, ENVIRONMENTS_FLAG, TEAMS_IN_SPACES } from 'featureFlags';
import NavBar from './NavBar/NavBar';
import { getVariation } from 'LaunchDarkly';
import { getSpaceNavigationItems } from './SpaceNavigationBarItems';
import SidepanelContainer from './Sidepanel/SidepanelContainer';

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
    const spaceContext = getModule('spaceContext');

    const { organization } = spaceContext;

    const spaceId = spaceContext.getId();
    const organizationId = organization.sys.id;

    const [
      environmentsEnabled,
      teamsInSpacesFF,
      hasOrgTeamFeature,
      contentTagsEnabled
    ] = await Promise.all([
      getVariation(ENVIRONMENTS_FLAG, { organizationId, spaceId }),
      getVariation(TEAMS_IN_SPACES, { organizationId, spaceId }),
      getOrgFeature(organizationId, 'teams'),
      getCurrentSpaceFeature(PC_CONTENT_TAGS)
    ]);

    const canManageEnvironments = accessChecker.can('manage', 'Environments');
    const isMasterEnvironment = spaceContext.isMasterEnvironment();
    const usageEnabled = organization.pricingVersion === 'pricing_version_2';

    function canNavigateTo(section) {
      const isSpaceSettingsSection = SPACE_SETTINGS_SECTIONS.includes(section);

      if (isSpaceSettingsSection && !isMasterEnvironment) {
        return false;
      }

      const sectionAvailable = accessChecker.getSectionVisibility()[section];
      const enforcements = spaceContext.getData('enforcements') || [];
      const isHibernated = enforcements.some((e) => e.reason === 'hibernated');

      return spaceContext.space && !isHibernated && sectionAvailable;
    }

    const items = getSpaceNavigationItems({
      canNavigateTo,
      usageEnabled,
      hasOrgTeamFeature,
      teamsInSpacesFF,
      useSpaceEnviroment: canManageEnvironments && environmentsEnabled,
      isMasterEnvironment,
      contentTagsEnabled
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
