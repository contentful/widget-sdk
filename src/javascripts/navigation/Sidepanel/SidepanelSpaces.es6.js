import React from 'react';
import PropTypes from 'prop-types';
import SpaceIcon from 'svg/space.es6';
import FolderIcon from 'svg/folder.es6';
import SpaceWithEnvironments from './SpaceWithEnvironments.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';

function OrgSpacesHeader({ canCreateSpaceInCurrOrg, showCreateSpaceModal }) {
  return (
    <div className="nav-sidepanel__spaces-header">
      <p className="nav-sidepanel__spaces-header-heading">Spaces</p>
      {canCreateSpaceInCurrOrg && (
        <a
          className="text-link"
          onClick={showCreateSpaceModal}
          data-test-id="sidepanel-add-space-link">
          + Create space
        </a>
      )}
    </div>
  );
}
OrgSpacesHeader.propTypes = {
  canCreateSpaceInCurrOrg: PropTypes.bool,
  showCreateSpaceModal: PropTypes.func.isRequired
};

function SpaceList(props) {
  const {
    spaces,
    currentSpaceId,
    currentEnvId,
    goToSpace,
    openedSpaceId,
    setOpenedSpaceId,
    environmentsEnabled
  } = props;

  return (
    <ul className="nav-sidepanel__space-list">
      {spaces.map((space, index) => {
        const isCurrSpace = space.sys.id === currentSpaceId;

        if (environmentsEnabled && accessChecker.can('manage', 'Environments')) {
          return (
            <SpaceWithEnvironments
              index={index}
              key={space.sys.id}
              space={space}
              isCurrSpace={isCurrSpace}
              currentEnvId={currentEnvId}
              goToSpace={goToSpace}
              openedSpaceId={openedSpaceId}
              setOpenedSpaceId={setOpenedSpaceId}
            />
          );
        }

        return (
          <li
            key={space.sys.id}
            className={`nav-sidepanel__space-list-item ${
              isCurrSpace ? 'nav-sidepanel__space-list-item--is-active' : ''
            }`}
            onClick={() => goToSpace(space.sys.id)}
            data-test-id={`sidepanel-space-link-${index}`}
            data-test-group-id="sidepanel-space-link"
            aria-selected={isCurrSpace ? 'true' : 'false'}>
            <div className="nav-sidepanel__space-title">
              <div className="nav-sidepanel__space-icon">
                <FolderIcon />
              </div>
              <span
                className={`u-truncate nav-sidepanel__space-name ${
                  isCurrSpace ? 'nav-sidepanel__space-name--is-active' : ''
                }`}>
                {space.name}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

SpaceList.propTypes = {
  spaces: PropTypes.arrayOf(PropTypes.object),
  currentSpaceId: PropTypes.string,
  currentEnvId: PropTypes.string,
  goToSpace: PropTypes.func,
  openedSpaceId: PropTypes.string,
  setOpenedSpaceId: PropTypes.func,
  environmentsEnabled: PropTypes.bool
};

function NoSpacesMsg({ canCreateSpaceInCurrOrg, showCreateSpaceModal }) {
  return (
    <div className="nav-sidepanel__no-spaces" data-test-id="sidepanel-no-spaces">
      <SpaceIcon />
      <p className="nav-sidepanel__no-spaces-heading">
        {canCreateSpaceInCurrOrg
          ? 'Let’s go - create your first space!'
          : 'Uh oh! Nothing to see here'}
      </p>
      <p>
        {canCreateSpaceInCurrOrg
          ? 'A space is a place where you keep all the content related to a single project.'
          : 'Seems like you don’t have access to any of your organization’s spaces. Contact your organization admin to add you to spaces.'}
      </p>
      {canCreateSpaceInCurrOrg && (
        <button
          className="btn-action nav-sidepanel__no-spaces-create-cta"
          data-test-id="sidepanel-create-space-btn"
          onClick={showCreateSpaceModal}>
          Create Space
        </button>
      )}
    </div>
  );
}

NoSpacesMsg.propTypes = {
  canCreateSpaceInCurrOrg: PropTypes.bool,
  showCreateSpaceModal: PropTypes.func.isRequired
};

export default function SidepanelSpaces(props) {
  const { currOrg, spacesByOrg, canCreateSpaceInCurrOrg, showCreateSpaceModal } = props;
  const spaces = currOrg && spacesByOrg[currOrg.sys.id];

  return (
    <div className="nav-sidepanel__spaces-container">
      {spaces && (
        <OrgSpacesHeader
          canCreateSpaceInCurrOrg={canCreateSpaceInCurrOrg}
          showCreateSpaceModal={showCreateSpaceModal}
        />
      )}
      {spaces && <SpaceList {...props} spaces={spaces} />}
      {!spaces && (
        <NoSpacesMsg
          canCreateSpaceInCurrOrg={canCreateSpaceInCurrOrg}
          showCreateSpaceModal={showCreateSpaceModal}
        />
      )}
    </div>
  );
}

SidepanelSpaces.propTypes = {
  canCreateSpaceInCurrOrg: PropTypes.bool,
  showCreateSpaceModal: PropTypes.func.isRequired,
  spacesByOrg: PropTypes.object.isRequired,
  currOrg: PropTypes.object
};
