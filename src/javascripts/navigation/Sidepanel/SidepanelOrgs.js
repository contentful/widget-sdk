import React from 'react';
import PropTypes from 'prop-types';

function OrganizationSelector({ currOrg, openOrgsDropdown, orgDropdownIsShown }) {
  return (
    <div
      onClick={openOrgsDropdown}
      data-test-id="sidepanel-header"
      className={`nav-sidepanel__header ${
        orgDropdownIsShown ? 'nav-sidepanel__header--is-active' : ''
      }`}>
      <p className="nav-sidepanel__org-img" data-test-id="sidepanel-header-org-icon">
        {currOrg.name.slice(0, 2).toUpperCase()}
      </p>
      <div className="nav-sidepanel__org-selector-container">
        <div className="nav-sidepanel__org-selector" data-test-id="sidepanel-org-selector">
          <p className="nav-sidepanel__org-selector-heading">Organization</p>
          <p
            className="nav-sidepanel__org-selector-current-org"
            data-test-id="sidepanel-header-curr-org"
            title={currOrg.name}>
            {currOrg.name}
          </p>
        </div>
      </div>
      <span />
    </div>
  );
}

OrganizationSelector.propTypes = {
  currOrg: PropTypes.object.isRequired,
  openOrgsDropdown: PropTypes.func.isRequired,
  orgDropdownIsShown: PropTypes.bool
};

function OrgListDropdown({
  orgs,
  setCurrOrg,
  orgDropdownIsShown,
  currOrg,
  canCreateOrg,
  createNewOrg
}) {
  return (
    <div
      className={`nav-sidepanel__org-list-container ${
        orgDropdownIsShown ? 'nav-sidepanel__org-list-container--is-visible' : ''
      }`}
      aria-hidden={orgDropdownIsShown ? '' : 'true'}
      data-test-id="sidepanel-org-list">
      <Organizations orgs={orgs} currOrg={currOrg} setCurrOrg={setCurrOrg} />
      {canCreateOrg && (
        <a
          data-test-id="sidepanel-create-org-link"
          className="text-link nav-sidepanel__org-create-cta"
          onClick={createNewOrg}>
          + Create organization
        </a>
      )}
    </div>
  );
}

OrgListDropdown.propTypes = {
  orgs: PropTypes.arrayOf(PropTypes.object),
  currOrg: PropTypes.object.isRequired,
  setCurrOrg: PropTypes.func.isRequired,
  orgDropdownIsShown: PropTypes.bool,
  canCreateOrg: PropTypes.bool,
  createNewOrg: PropTypes.func.isRequired
};

function Organizations({ orgs, currOrg, setCurrOrg }) {
  return (
    <div className="nav-sidepanel__org-list">
      <p className="nav-sidepanel__org-list-heading">Organizations</p>
      {(orgs || []).map((org, index) => {
        return (
          <p
            key={`org-${org.sys.id}`}
            className={`nav-sidepanel__org-name u-truncate ${
              currOrg.sys.id === org.sys.id ? 'nav-sidepanel__org-name--is-active' : ''
            }`}
            data-test-id={`sidepanel-org-link-${index}`}
            data-test-group-id="sidepanel-org-link"
            onClick={() => setCurrOrg(org)}>
            {org.name}
          </p>
        );
      })}
    </div>
  );
}

Organizations.propTypes = {
  orgs: PropTypes.arrayOf(PropTypes.object),
  currOrg: PropTypes.object.isRequired,
  setCurrOrg: PropTypes.func.isRequired
};

export default function SidepanelOrgs(props) {
  const { currOrg } = props;

  if (!currOrg) {
    return;
  }

  return (
    <div>
      <OrganizationSelector {...props} />
      <OrgListDropdown {...props} />
    </div>
  );
}

SidepanelOrgs.propTypes = {
  currOrg: PropTypes.object.isRequired
};
