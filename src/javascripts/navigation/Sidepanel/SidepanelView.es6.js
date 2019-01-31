import React from 'react';
import PropTypes from 'prop-types';
import { connect, Provider } from 'react-redux';
import { get } from 'lodash';
import CloseIcon from 'svg/close.es6';
import SettingsIcon from 'svg/settings.es6';
import TeamsIcon from 'svg/nav-organization-teams.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import store from 'redux/store.es6';
import hasOrgTeamFeature from 'redux/selectors/hasOrgTeamFeature.es6';
import SidepanelOrgs from './SidepanelOrgs.es6';
import SidepanelSpaces from './SidepanelSpaces.es6';
import SidepanelNoOrgs from './SidepanelNoOrgs.es6';

function OrgActions({ gotoOrgSettings, viewingOrgSettings, showOrgSettingsAsTeams }) {
  return (
    <div className="nav-sidepanel__org-actions" data-test-id="sidepanel-org-actions">
      <div className="nav-sidepanel__org-actions-separator-container">
        <div className="nav-sidepanel__org-actions-separator" />
      </div>
      <div
        className={`nav-sidepanel__org-actions-goto-settings ${
          viewingOrgSettings ? 'nav-sidepanel__org-actions-goto-settings--is-active' : ''
        }`}
        onClick={gotoOrgSettings}
        data-test-id="sidepanel-org-actions-settings">
        <div className="nav-sidepanel__org-title">
          <div className="nav-sidepanel__org-icon">
            {showOrgSettingsAsTeams ? (
              <React.Fragment>
                <TeamsIcon />
                <span>Teams</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <SettingsIcon />
                <span>Organization settings</span>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

OrgActions.propTypes = {
  gotoOrgSettings: PropTypes.func.isRequired,
  viewingOrgSettings: PropTypes.bool,
  showOrgSettingsAsTeams: PropTypes.bool.isRequired
};

const Sidepanel = connect((state, { currOrg }) => {
  const orgId = get(currOrg, 'sys.id', null);
  return { teamsFeatureEnabled: hasOrgTeamFeature(state, { orgId }) };
})(props => {
  const {
    sidePanelIsShown,
    closeOrgsDropdown,
    closeSidePanel,
    teamsFeatureEnabled,
    teamsForMembersFF,
    gotoOrgSettings,
    viewingOrgSettings,
    currOrg
  } = props;

  const canGoToTeams = teamsFeatureEnabled && teamsForMembersFF;
  return (
    <div
      className={`nav-sidepanel ${sidePanelIsShown ? 'nav-sidepanel--is-active' : ''}`}
      aria-hidden={sidePanelIsShown ? '' : 'true'}
      onClick={closeOrgsDropdown}
      data-test-id="sidepanel">
      {currOrg && <SidepanelOrgs {...props} />}
      {currOrg && <SidepanelSpaces {...props} />}
      {!currOrg && <SidepanelNoOrgs {...props} />}
      {(isOwnerOrAdmin(currOrg) || canGoToTeams) && (
        <OrgActions
          gotoOrgSettings={gotoOrgSettings}
          viewingOrgSettings={viewingOrgSettings}
          showOrgSettingsAsTeams={!isOwnerOrAdmin(currOrg)}
        />
      )}
      <div
        className="nav-sidepanel__close-btn"
        onClick={closeSidePanel}
        data-test-id="sidepanel-close-btn">
        <CloseIcon />
      </div>
    </div>
  );
});

Sidepanel.propTypes = {
  sidePanelIsShown: PropTypes.bool,
  closeOrgsDropdown: PropTypes.func,
  closeSidePanel: PropTypes.func,
  gotoOrgSettings: PropTypes.func,
  viewingOrgSettings: PropTypes.any,
  currOrg: PropTypes.object,
  teamsFeatureEnabled: PropTypes.bool,
  teamsForMembersFF: PropTypes.bool
};

export default function SidepanelView(props) {
  const { sidePanelIsShown, orgDropdownIsShown, closeOrgsDropdown, closeSidePanel } = props;

  return (
    <Provider store={store}>
      <div className="nav-sidepanel-container">
        <div
          className={`nav-sidepanel__bg ${sidePanelIsShown ? 'nav-sidepanel__bg--is-visible' : ''}`}
          onClick={orgDropdownIsShown ? closeOrgsDropdown : closeSidePanel}
        />
        <Sidepanel {...props} />
      </div>
    </Provider>
  );
}

SidepanelView.propTypes = {
  sidePanelIsShown: PropTypes.bool,
  closeOrgsDropdown: PropTypes.func,
  closeSidePanel: PropTypes.func,
  canGotoOrgSettings: PropTypes.bool,
  gotoOrgSettings: PropTypes.func,
  viewingOrgSettings: PropTypes.any,
  currOrg: PropTypes.object,
  orgDropdownIsShown: PropTypes.bool,
  teamsForMembersFF: PropTypes.bool
};
