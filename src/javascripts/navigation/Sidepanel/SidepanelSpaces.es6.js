import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import FolderIcon from 'svg/folder.es6';
import SpaceWithEnvironments from './SpaceWithEnvironments.es6';
import { canAccessSpaceEnvironments } from 'access_control/AccessChecker/index.es6';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer.es6';
import { Button, Heading, Paragraph } from '@contentful/forma-36-react-components';
import EmptyStateAdminIllustration from 'svg/folder-illustration.es6';
import EmptyStatePractitionerIllustration from 'svg/coffee-cup-illustration.es6';

const styles = { svgContainer: css({ width: '150px' }) };

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

        if (environmentsEnabled && canAccessSpaceEnvironments(space)) {
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
const getAdminEmptyState = showCreateSpaceModal => (
  <EmptyStateContainer>
    <div className={styles.svgContainer}>
      <EmptyStateAdminIllustration />
    </div>
    <Heading>Starting something new?</Heading>
    <Paragraph>
      A space is an area to manage and store content
      {/* <br> tag is needed to fix text overflow in IE. The EmptyStateContainer uses flex-box, and it doesn't work as expected in IE.*/}
      <br />
      for a specific project.
    </Paragraph>
    <Button testId="sidepanel-create-space-btn" onClick={showCreateSpaceModal}>
      Add a space
    </Button>
  </EmptyStateContainer>
);

const getPractitionerEmptyState = () => (
  <EmptyStateContainer>
    <div className={styles.svgContainer}>
      <EmptyStatePractitionerIllustration />
    </div>
    <Heading>No spaces, yet</Heading>
    <Paragraph> Have a chat with your admin to get access to a space.</Paragraph>
  </EmptyStateContainer>
);
function NoSpacesMsg({ canCreateSpaceInCurrOrg, showCreateSpaceModal }) {
  return (
    <div className="nav-sidepanel__no-spaces" data-test-id="sidepanel-no-spaces">
      {canCreateSpaceInCurrOrg
        ? getAdminEmptyState(showCreateSpaceModal)
        : getPractitionerEmptyState()}
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
  currOrg: PropTypes.object,
  goToSpace: PropTypes.func
};
