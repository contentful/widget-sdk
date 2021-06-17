import React from 'react';
import * as accessChecker from 'access_control/AccessChecker';
import {
  getOrgFeature,
  getSpaceFeature,
  OrganizationFeatures,
  SpaceFeatures,
} from 'data/CMA/ProductCatalog';
import { QuickNavigation } from 'features/quick-navigation';
import OnboardingRelaunch from 'navigation/modernStackOnboardingRelaunch';
import NavBar from './NavBar/NavBar';
import { FLAGS, getVariation } from 'core/feature-flags';
import { getSpaceNavigationItems } from './SpaceNavigationBarItems';
import { SidepanelContainer } from './Sidepanel/SidepanelContainer';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import {
  getOrganization,
  getOrganizationId,
  getSpaceEnforcements,
  isCurrentEnvironmentMaster,
} from 'core/services/SpaceEnvContext/utils';
import { TrialTag } from 'features/trials';
import { hasEnvironmentSectionInUrl } from 'core/react-routing/hasEnvironmentSectionInUrl';
import { NavigationItemType } from './NavBar/NavigationItem';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import {
  OrganizationName,
  StateTitle,
  EnvironmentLabel,
} from './Sidepanel/SidePanelTrigger/SidePanelTrigger';

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

type Props = {
  navVersion: number;
};

type State = { items: NavigationItemType[] };

const SpaceTriggerText = React.memo(() => {
  const { currentSpaceName, currentOrganizationName, currentSpace, currentSpaceEnvironments } =
    useSpaceEnvContext();

  const hasManyEnvs = (currentSpaceEnvironments || []).length > 1;
  const showEnvironments = hasManyEnvs || currentSpace?.environmentMeta.aliasId;

  return (
    <>
      {currentOrganizationName && <OrganizationName name={currentOrganizationName} />}
      {currentSpaceName && <StateTitle title={currentSpaceName || ''} />}
      {currentSpace && showEnvironments && (
        <EnvironmentLabel environmentMeta={currentSpace.environmentMeta} />
      )}
    </>
  );
});

const ProvidedSidepanelContainer = () => {
  const { currentEnvironmentAliasId, currentOrganizationId, currentSpaceId, currentEnvironmentId } =
    useSpaceEnvContext();
  return (
    <SidepanelContainer
      triggerText={<SpaceTriggerText />}
      currentOrgId={currentOrganizationId}
      currentSpaceId={currentSpaceId}
      currentAliasId={currentEnvironmentAliasId}
      currentEnvId={currentEnvironmentId}
    />
  );
};

export default class SpaceNavigationBar extends React.Component<Props, State> {
  static contextType = SpaceEnvContext;
  context!: React.ContextType<typeof SpaceEnvContext>;

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
      getOrgFeature(organizationId, OrganizationFeatures.TEAMS, false),
      getSpaceFeature(currentSpaceId, SpaceFeatures.PC_CONTENT_TAGS, false),
      accessChecker.waitToBeInitialized(),
    ]);

    const canManageEnvironments = accessChecker.can('manage', 'Environments');
    const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
    const usageEnabled = organization?.pricingVersion === 'pricing_version_2';
    const canManageSpace = accessChecker.canModifySpaceSettings();

    function canNavigateTo(section) {
      const isSpaceSettingsSection = SPACE_SETTINGS_SECTIONS.includes(section);

      if (isSpaceSettingsSection && !isMasterEnvironment) {
        return false;
      }

      const sectionAvailable = accessChecker.getSectionVisibility()[section];
      const isHibernated = getSpaceEnforcements(currentSpace).some(
        (e: any) => e.reason === 'hibernated'
      );

      return currentSpace && !isHibernated && sectionAvailable;
    }

    const items = getSpaceNavigationItems({
      canNavigateTo,
      usageEnabled,
      hasOrgTeamFeature,
      useSpaceEnvironment: canManageEnvironments && environmentsEnabled,
      isUnscopedRoute: !hasEnvironmentSectionInUrl(),
      contentTagsEnabled,
      canManageSpace,
    });

    this.setState({ items });
  }

  render() {
    return (
      <div className="app-top-bar">
        <ProvidedSidepanelContainer />
        <div className="app-top-bar__outer-wrapper">
          <NavBar listItems={this.state.items}>
            <div className="app-top-bar__child">
              <OnboardingRelaunch />
            </div>
            <TrialTag organizationId={this.context.currentOrganizationId} />
            <QuickNavigation />
          </NavBar>
        </div>
      </div>
    );
  }
}
