import React from 'react';
import PropTypes from 'prop-types';
import SettingsIcon from 'svg/settings.svg';
import NavigationIcon from 'ui/Components/NavigationIcon';

export default function OrgActions({ gotoOrgSettings, showOrgSettingsAsTeams }) {
  return (
    <div className="nav-sidepanel__org-actions" data-test-id="sidepanel-org-actions">
      <div className="nav-sidepanel__org-actions-separator-container">
        <div className="nav-sidepanel__org-actions-separator" />
      </div>
      <div
        className={`nav-sidepanel__org-actions-goto-settings`}
        onClick={gotoOrgSettings}
        data-test-id="sidepanel-org-actions-settings">
        <div className="nav-sidepanel__org-title">
          <div className="nav-sidepanel__org-icon">
            {showOrgSettingsAsTeams ? (
              <>
                <NavigationIcon name="teams" size="medium" color="white" />
                <span>Teams</span>
              </>
            ) : (
              <>
                <SettingsIcon />
                <span>Organization settings</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

OrgActions.propTypes = {
  gotoOrgSettings: PropTypes.func.isRequired,
  showOrgSettingsAsTeams: PropTypes.bool.isRequired
};
