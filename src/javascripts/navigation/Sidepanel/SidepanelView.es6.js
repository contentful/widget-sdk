import React from 'react';
import PropTypes from 'prop-types';
import CloseIcon from 'svg/close.es6';
import SettingsIcon from 'svg/settings.es6';
import SidepanelOrgs from './SidepanelOrgs.es6';
import SidepanelSpaces from './SidepanelSpaces.es6';
import SidepanelNoOrgs from './SidepanelNoOrgs.es6';

function Sidepanel(props) {
  const {
    sidePanelIsShown,
    closeOrgsDropdown,
    closeSidePanel,
    canGotoOrgSettings,
    gotoOrgSettings,
    viewingOrgSettings,
    currOrg
  } = props;

  return (
    <div
      className={`nav-sidepanel ${sidePanelIsShown ? 'nav-sidepanel--is-active' : ''}`}
      aria-hidden={sidePanelIsShown ? '' : 'true'}
      onClick={closeOrgsDropdown}
      data-test-id="sidepanel">
      {currOrg && <SidepanelOrgs {...props} />}
      {currOrg && <SidepanelSpaces {...props} />}
      {!currOrg && <SidepanelNoOrgs {...props} />}
      {canGotoOrgSettings && (
        <OrgActions gotoOrgSettings={gotoOrgSettings} viewingOrgSettings={viewingOrgSettings} />
      )}
      <div
        className="nav-sidepanel__close-btn"
        onClick={closeSidePanel}
        data-test-id="sidepanel-close-btn">
        <CloseIcon />
      </div>
    </div>
  );
}

Sidepanel.propTypes = {
  sidePanelIsShown: PropTypes.bool,
  closeOrgsDropdown: PropTypes.func,
  closeSidePanel: PropTypes.func,
  canGotoOrgSettings: PropTypes.bool,
  gotoOrgSettings: PropTypes.func,
  viewingOrgSettings: PropTypes.any,
  currOrg: PropTypes.object
};

function OrgActions({ gotoOrgSettings, viewingOrgSettings }) {
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
            <SettingsIcon />
            <span>Organization settings</span>
          </div>
        </div>
      </div>
    </div>
  );
}

OrgActions.propTypes = {
  gotoOrgSettings: PropTypes.func.isRequired,
  viewingOrgSettings: PropTypes.bool
};

export default function SidepanelView(props) {
  const { sidePanelIsShown, orgDropdownIsShown, closeOrgsDropdown, closeSidePanel } = props;

  return (
    <div className="nav-sidepanel-container">
      <div
        className={`nav-sidepanel__bg ${sidePanelIsShown ? 'nav-sidepanel__bg--is-visible' : ''}`}
        onClick={orgDropdownIsShown ? closeOrgsDropdown : closeSidePanel}
      />
      <Sidepanel {...props} />
    </div>
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
  orgDropdownIsShown: PropTypes.bool
};
