import React from 'react';
import { css, cx } from 'emotion';
import {
  Button,
  Flex,
  Heading,
  SectionHeading,
  Paragraph,
  Icon,
  List,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { canAccessSpaceEnvironments } from 'access_control/AccessChecker';
import type { Organization, SpaceData } from 'classes/spaceContextTypes';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import SpaceWithEnvironments from './SpaceWithEnvironments';

import EmptyStateAdminIllustration from 'svg/folder-illustration.svg';
import EmptyStatePractitionerIllustration from 'svg/coffee-cup-illustration.svg';

const styles = {
  svgContainer: css({ width: '150px' }),
  folderIcon: css({
    marginRight: tokens.spacingXs,
  }),
  spaceList: css({
    // Org selector's height = 70px
    // "Spaces" Section Heading height and its margin-top = 48px
    // "+ Add Space" link's height = 51px
    // and Org settings button = 54px
    maxHeight: `calc(100vh - 70px - 48px - 51px - 54px)`,
    overflowY: 'auto',
    borderTop: `1px solid ${tokens.colorElementLight}`,
  }),
  spaceListItem: css({
    cursor: 'pointer',
    margin: 0,
    padding: `${tokens.spacingXs} ${tokens.spacingM}`,
    '&:hover': {
      backgroundColor: tokens.colorElementLight,
    },
  }),
  isActive: css({
    backgroundColor: tokens.colorElementLight,
  }),
  addSpaceLinkContainer: css({
    borderTop: `1px solid ${tokens.colorElementLight}`,
  }),
  addSpaceLink: css({
    display: 'flex',
    alignItems: 'center',
    padding: tokens.spacingM,
    borderTop: `1px solid ${tokens.colorElementLight}`,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorElementLight,
    },
    '& svg': {
      marginRight: tokens.spacingXs,
    },
  }),
};

interface SpaceListProps {
  spaces: SpaceData[];
  currentSpaceId?: string;
  currentEnvId?: string;
  currentAliasId?: string;
  goToSpace: (spaceId: string, envId?: string, isMaster?: boolean) => void;
  openedSpaceId?: string;
  setOpenedSpaceId: (spaceId: string) => void;
}

function SpaceList({
  spaces,
  currentSpaceId,
  currentEnvId,
  currentAliasId,
  goToSpace,
  openedSpaceId,
  setOpenedSpaceId,
}: SpaceListProps) {
  return (
    <List className={styles.spaceList}>
      {spaces.map((space, index) => {
        const isCurrSpace = space.sys.id === currentSpaceId;

        if (canAccessSpaceEnvironments(space)) {
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
            className={cx(styles.spaceListItem, { [styles.isActive]: isCurrSpace })}
            onClick={() => goToSpace(space.sys.id)}
            data-test-id={`sidepanel-space-link-${index}`}
            data-test-group-id="sidepanel-space-link"
            aria-selected={isCurrSpace ? 'true' : 'false'}>
            <Flex alignItems="center">
              <Icon className={styles.folderIcon} icon="FolderOpen" color="muted" />
              {space.name}
            </Flex>
          </li>
        );
      })}
    </List>
  );
}

interface SidepanelSpacesProps {
  canCreateSpaceInCurrOrg?: boolean;
  currentAliasId?: string;
  currentEnvId?: string;
  currentSpaceId?: string;
  currOrg?: Organization;
  goToSpace: (spaceId: string, envId?: string, isMaster?: boolean) => void;
  openedSpaceId?: string;
  setOpenedSpaceId: (spaceId: string) => void;
  spacesByOrg: { [key: string]: SpaceData[] };
  triggerSpaceCreation: () => void;
}

export function SidepanelSpaces({
  currOrg,
  spacesByOrg,
  canCreateSpaceInCurrOrg = false,
  triggerSpaceCreation,
  ...otherProps
}: SidepanelSpacesProps) {
  const spaces = currOrg && spacesByOrg[currOrg.sys.id];

  return (
    <Flex flexDirection="column">
      {!spaces && (
        <Flex
          paddingLeft="spacingM"
          paddingRight="spacingM"
          paddingTop="spacingL"
          testId="sidepanel-no-spaces">
          {canCreateSpaceInCurrOrg ? (
            <AdminEmptyState triggerSpaceCreation={triggerSpaceCreation} />
          ) : (
            <PractitionerEmptyState />
          )}
        </Flex>
      )}

      {spaces && (
        <>
          <Flex
            marginTop="spacingL"
            marginBottom="spacingXs"
            paddingLeft="spacingM"
            paddingRight="spacingM">
            <SectionHeading>Spaces</SectionHeading>
          </Flex>

          <SpaceList {...otherProps} spaces={spaces} />

          {canCreateSpaceInCurrOrg && (
            <div
              data-test-id="sidepanel-add-space-link"
              className={styles.addSpaceLink}
              onClick={triggerSpaceCreation}>
              <Icon icon="PlusCircle" color="muted" />
              Add space
            </div>
          )}
        </>
      )}
    </Flex>
  );
}

interface AdminEmptyStateProps {
  triggerSpaceCreation: () => void;
}

function AdminEmptyState({ triggerSpaceCreation }: AdminEmptyStateProps) {
  return (
    <EmptyStateContainer>
      <div className={styles.svgContainer}>
        <EmptyStateAdminIllustration />
      </div>
      <Heading>Starting something new?</Heading>
      <Paragraph>A space is an area to manage and store content for a specific project.</Paragraph>
      <Button testId="sidepanel-create-space-btn" onClick={triggerSpaceCreation}>
        Add a space
      </Button>
    </EmptyStateContainer>
  );
}

function PractitionerEmptyState() {
  return (
    <EmptyStateContainer>
      <div className={styles.svgContainer}>
        <EmptyStatePractitionerIllustration />
      </div>
      <Heading>No spaces, yet</Heading>
      <Paragraph> Have a chat with your admin to get access to a space.</Paragraph>
    </EmptyStateContainer>
  );
}
