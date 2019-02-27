import React from 'react';
import PropTypes from 'prop-types';
import SettingsIcon from 'svg/settings.es6';
import TeamsIcon from 'svg/nav-organization-teams.es6';

export default function OrgActions({
  gotoOrgSettings,
  viewingOrgSettings,
  showOrgSettingsAsTeams
}) {
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
