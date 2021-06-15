import React, { MouseEvent } from 'react';
import { get } from 'lodash';
import { css, cx } from 'emotion';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { Icon, Flex } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import * as accessChecker from 'access_control/AccessChecker/index';
import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import type { Organization, SpaceData } from 'classes/spaceContextTypes';
import * as K from 'core/utils/kefir';
import { captureError } from 'core/monitoring';
import { ReactRouterLink } from 'core/react-routing';
import * as Navigator from 'states/Navigator';
import * as CreateSpace from 'services/CreateSpace';
import * as TokenStore from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';

import { SidepanelOrgs } from './SidepanelOrgs';
import { SidepanelSpaces } from './SidepanelSpaces';
import SidepanelNoOrgs from './SidepanelNoOrgs';

const styles = {
  sidepanel: css({
    position: 'absolute',
    left: '-395px',
    width: '350px',
    height: '100vh',
    backgroundColor: tokens.colorElementLightest,
    transition: `left ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
  }),
  sidepanelIsVisible: css({
    left: 0,
  }),
  orgSettingsButton: css({
    cursor: 'pointer',
    borderTop: `1px solid ${tokens.colorElementLight}`,
    color: tokens.colorTextDark,
    '&:hover': {
      backgroundColor: tokens.colorElementLight,
      textDecoration: 'none',
    },
  }),
};

interface SpacesByOrg {
  [key: string]: SpaceData[];
}

interface SidepanelProps {
  currentSpaceId?: string;
  currentEnvId?: string;
  currentAliasId?: string;
  currentOrgId?: string;
  sidePanelIsShown: boolean;
  closeOrgsDropdown: () => void;
  closeSidePanel: () => void;
  orgDropdownIsShown: boolean;
  openOrgsDropdown: (event: MouseEvent) => void;
}

interface SidepanelState {
  initialized: boolean;
  viewingOrgSettings: boolean;
  currOrg?: Organization;
  orgs: Organization[];
  spacesByOrg: SpacesByOrg;
  openedSpaceId?: string;
  environmentsEnabled: boolean;

  currentSpaceId?: string;
  currentEnvId?: string;
  currentAliasId?: string;
  canCreateSpaceInCurrOrg?: boolean;
  canCreateOrg?: boolean;
}

export class Sidepanel extends React.Component<SidepanelProps, SidepanelState> {
  constructor(props) {
    super(props);
    this.state = {
      initialized: false,
      viewingOrgSettings: false,
      orgs: [],
      spacesByOrg: {},
      environmentsEnabled: false,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.sidePanelIsShown === false && this.props.sidePanelIsShown === true) {
      this.initializeSidebar();
    }
  }

  async initializeSidebar() {
    const [orgs, spacesByOrg] = await Promise.all([
      K.getValue<Organization[]>(TokenStore.organizations$),
      K.getValue<SpacesByOrg>(TokenStore.spacesByOrganization$),
    ]);

    const currentSpaceId = this.props.currentSpaceId;
    const currentEnvId = this.props.currentEnvId;
    const currentAliasId = this.props.currentAliasId;
    const org = orgs.find((org) => org.sys.id === this.props.currentOrgId) || orgs[0];
    const currentOrgId = get(org, ['sys', 'id']);

    const environmentsEnabled = await getVariation(FLAGS.ENVIRONMENTS_FLAG, {
      spaceId: currentSpaceId,
      organizationId: currentOrgId,
    });

    this.setState(
      {
        orgs: orgs ?? [],
        spacesByOrg: spacesByOrg ?? {},
        currentSpaceId,
        currentEnvId,
        currentAliasId,
        environmentsEnabled,
      },
      () => {
        this.setCurrOrg(org);
      }
    );
  }

  setCurrOrg = (currOrg) => {
    const orgId = currOrg.sys.id;
    const isChangingOrg = get(this.state, ['currOrg', 'sys', 'id']) !== orgId;

    this.setState((prevState) => ({
      ...prevState,
      initialized: true,
      currOrg,
      canCreateSpaceInCurrOrg: accessChecker.canCreateSpaceInOrganization(orgId),
      canCreateOrg: accessChecker.canCreateOrganization(),
      // Collapse environment list if changing organization
      ...(isChangingOrg && { openedSpaceId: undefined }),
    }));
  };

  goToSpace = async (spaceId, envId, isMaster) => {
    envId = isMaster ? undefined : envId;
    const path = ['spaces', envId ? 'environment' : 'detail'];

    this.props.closeSidePanel();

    try {
      await Navigator.go({
        path,
        params: {
          spaceId,
          environmentId: envId,
        },
        options: { reload: true },
      });
    } catch (err) {
      // Collapse environment list if navigation failed
      // e.g. when environment was deleted
      this.setState({ openedSpaceId: undefined });
      captureError(err);
    }
  };

  createNewOrg = () => {
    this.props.closeSidePanel();
    Navigator.go({
      path: ['account', 'new_organization'],
    });
  };

  triggerSpaceCreation = async () => {
    const organizationId = this.state.currOrg?.sys.id;

    if (organizationId) {
      trackCTAClick(CTA_EVENTS.CREATE_SPACE, {
        organizationId,
        ctaLocation: 'sidepanel',
      });

      this.props.closeSidePanel();
      CreateSpace.beginSpaceCreation(organizationId);
    }
  };

  setOpenedSpaceId = (spaceId) => {
    this.setState({ openedSpaceId: spaceId });
  };

  render() {
    const { sidePanelIsShown, closeOrgsDropdown } = this.props;

    const isOrgOwnerOrAdmin = isOwnerOrAdmin(this.state.currOrg);

    return (
      <div
        className={cx(styles.sidepanel, { [styles.sidepanelIsVisible]: sidePanelIsShown })}
        aria-hidden={sidePanelIsShown ? 'false' : 'true'}
        onClick={closeOrgsDropdown}
        data-test-id="sidepanel">
        {this.state.currOrg && this.state.initialized && (
          <>
            <SidepanelOrgs
              canCreateOrg={this.state.canCreateOrg}
              createNewOrg={this.createNewOrg}
              currOrg={this.state.currOrg}
              openOrgsDropdown={this.props.openOrgsDropdown}
              orgDropdownIsShown={this.props.orgDropdownIsShown}
              orgs={this.state.orgs}
              setCurrOrg={this.setCurrOrg}
            />

            <SidepanelSpaces
              spacesByOrg={this.state.spacesByOrg}
              openedSpaceId={this.state.openedSpaceId}
              canCreateSpaceInCurrOrg={this.state.canCreateSpaceInCurrOrg}
              environmentsEnabled={this.state.environmentsEnabled}
              currentSpaceId={this.state.currentSpaceId}
              currentEnvId={this.state.currentEnvId}
              currentAliasId={this.state.currentAliasId}
              currOrg={this.state.currOrg}
              triggerSpaceCreation={this.triggerSpaceCreation}
              goToSpace={this.goToSpace}
              setOpenedSpaceId={this.setOpenedSpaceId}
            />

            {this.state.currOrg && (
              <ReactRouterLink
                route={{
                  path: isOrgOwnerOrAdmin
                    ? 'organizations.subscription.overview'
                    : 'organizations.teams',
                  orgId: this.state.currOrg.sys.id,
                }}
                onClick={this.props.closeSidePanel}
                data-test-id="sidepanel-org-actions-settings">
                <Flex padding="spacingM" className={styles.orgSettingsButton}>
                  <Icon
                    className={css({ marginRight: tokens.spacingXs })}
                    icon="Settings"
                    color="muted"
                  />
                  Organization settings
                  {isOrgOwnerOrAdmin && ' & subscriptions'}
                </Flex>
              </ReactRouterLink>
            )}
          </>
        )}

        {!this.state.currOrg && this.state.initialized && (
          <SidepanelNoOrgs createNewOrg={this.createNewOrg} />
        )}
      </div>
    );
  }
}
