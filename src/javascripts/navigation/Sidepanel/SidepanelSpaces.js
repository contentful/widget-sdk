import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import FolderIcon from 'svg/folder.svg';
import SpaceWithEnvironments from './SpaceWithEnvironments';
import { canAccessSpaceEnvironments } from 'access_control/AccessChecker';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { Button, Heading, Paragraph, TextLink, List } from '@contentful/forma-36-react-components';
import EmptyStateAdminIllustration from 'svg/folder-illustration.svg';
import EmptyStatePractitionerIllustration from 'svg/coffee-cup-illustration.svg';

const styles = { svgContainer: css({ width: '150px' }) };

function OrgSpacesHeader({ canCreateSpaceInCurrOrg, triggerSpaceCreation }) {
  return (
    <div className="nav-sidepanel__spaces-header">
      <Paragraph className="nav-sidepanel__spaces-header-heading">Spaces</Paragraph>
      {canCreateSpaceInCurrOrg ? (
        <TextLink
          className="text-link"
          onClick={triggerSpaceCreation}
          data-test-id="sidepanel-add-space-link">
          + Create space
        </TextLink>
      ) : null}
    </div>
  );
}
OrgSpacesHeader.propTypes = {
  canCreateSpaceInCurrOrg: PropTypes.bool,
  triggerSpaceCreation: PropTypes.func.isRequired,
};

function SpaceList(props) {
  const {
    spaces,
    currentSpaceId,
    currentEnvId,
    currentAliasId,
    goToSpace,
    openedSpaceId,
    setOpenedSpaceId,
    environmentsEnabled,
  } = props;

  return (
    <List className="nav-sidepanel__space-list">
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
              currentAliasId={currentAliasId}
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
    </List>
  );
}

SpaceList.propTypes = {
  spaces: PropTypes.arrayOf(PropTypes.object),
  currentSpaceId: PropTypes.string,
  currentEnvId: PropTypes.string,
  currentAliasId: PropTypes.string,
  goToSpace: PropTypes.func,
  openedSpaceId: PropTypes.string,
  setOpenedSpaceId: PropTypes.func,
  environmentsEnabled: PropTypes.bool,
};
const getAdminEmptyState = (triggerSpaceCreation) => (
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
    <Button testId="sidepanel-create-space-btn" onClick={triggerSpaceCreation}>
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
function NoSpacesMsg({ canCreateSpaceInCurrOrg, triggerSpaceCreation }) {
  return (
    <div className="nav-sidepanel__no-spaces" data-test-id="sidepanel-no-spaces">
      {canCreateSpaceInCurrOrg
        ? getAdminEmptyState(triggerSpaceCreation)
        : getPractitionerEmptyState()}
    </div>
  );
}

NoSpacesMsg.propTypes = {
  canCreateSpaceInCurrOrg: PropTypes.bool,
  triggerSpaceCreation: PropTypes.func.isRequired,
};

export default function SidepanelSpaces(props) {
  const { currOrg, spacesByOrg, canCreateSpaceInCurrOrg, triggerSpaceCreation } = props;
  const spaces = currOrg && spacesByOrg[currOrg.sys.id];

  return (
    <div className="nav-sidepanel__spaces-container">
      {spaces && (
        <OrgSpacesHeader
          canCreateSpaceInCurrOrg={canCreateSpaceInCurrOrg}
          triggerSpaceCreation={triggerSpaceCreation}
        />
      )}
      {spaces && <SpaceList {...props} spaces={spaces} />}
      {!spaces && (
        <NoSpacesMsg
          canCreateSpaceInCurrOrg={canCreateSpaceInCurrOrg}
          triggerSpaceCreation={triggerSpaceCreation}
        />
      )}
    </div>
  );
}

SidepanelSpaces.propTypes = {
  canCreateSpaceInCurrOrg: PropTypes.bool.isRequired,
  triggerSpaceCreation: PropTypes.func.isRequired,
  spacesByOrg: PropTypes.object.isRequired,
  currOrg: PropTypes.object.isRequired,
  goToSpace: PropTypes.func.isRequired,
};
