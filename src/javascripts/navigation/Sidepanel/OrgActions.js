import React from 'react';
import PropTypes from 'prop-types';
import SettingsIcon from 'svg/settings.svg';

export default function OrgActions({ gotoOrgSettings, showSubscriptionSettings }) {
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
            <SettingsIcon />
            <span>Organization settings {showSubscriptionSettings ? '& subscriptions' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

OrgActions.propTypes = {
  gotoOrgSettings: PropTypes.func.isRequired,
  showSubscriptionSettings: PropTypes.bool.isRequired,
};
