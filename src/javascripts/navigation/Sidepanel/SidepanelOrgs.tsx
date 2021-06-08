import React, { MouseEvent } from 'react';
import { css, cx } from 'emotion';
import {
  Flex,
  Icon,
  Paragraph,
  Dropdown,
  DropdownList,
  DropdownListItem,
  TextLink,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import type { Organization } from 'classes/spaceContextTypes';

const styles = {
  fontDemiBold: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
  orgSwitcher: css({
    height: '70px',
    padding: `0 ${tokens.spacingM}`,
    alignItems: 'center',
    display: 'grid',
    gridTemplateColumns: '35px auto 16px',
    columnGap: tokens.spacingXs,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorElementLight,
    },
  }),
  orgAvatar: css({
    height: '35px',
    backgroundColor: tokens.colorElementDark,
    textAlign: 'center',
    borderRadius: '2px',
  }),
};

interface SidepanelOrgsProps {
  canCreateOrg?: boolean;
  createNewOrg: () => void;
  currOrg: Organization;
  openOrgsDropdown: (event: MouseEvent) => void;
  orgDropdownIsShown: boolean;
  orgs: Organization[];
  setCurrOrg: (currOrg: Organization) => void;
}

export function SidepanelOrgs({
  orgDropdownIsShown,
  openOrgsDropdown,
  canCreateOrg = false,
  createNewOrg,
  currOrg,
  orgs,
  setCurrOrg,
}: SidepanelOrgsProps) {
  return (
    <>
      <Dropdown
        isFullWidth
        className={css({ width: '100%' })}
        isOpen={orgDropdownIsShown}
        toggleElement={
          <div
            data-test-id="sidepanel-header"
            className={styles.orgSwitcher}
            onClick={openOrgsDropdown}>
            <Flex
              testId="sidepanel-header-org-icon"
              className={cx(styles.orgAvatar, styles.fontDemiBold)}
              justifyContent="center"
              alignItems="center">
              {currOrg.name.slice(0, 2).toUpperCase()}
            </Flex>

            <Flex flexDirection="column">
              <div className={styles.fontDemiBold}>Organization</div>
              <Paragraph id="organization-name" testId="sidepanel-header-curr-org">
                {currOrg.name}
              </Paragraph>
            </Flex>

            <Icon icon="ArrowDown" color="muted" />
          </div>
        }>
        <DropdownList maxHeight={230}>
          <DropdownListItem isTitle>Organizations</DropdownListItem>
          {(orgs || []).map((org, index) => {
            return (
              <DropdownListItem
                key={`org-${org.sys.id}`}
                isActive={currOrg.sys.id === org.sys.id}
                testId={`sidepanel-org-link-${index}`}
                data-test-group-id="sidepanel-org-link"
                onClick={() => setCurrOrg(org)}>
                {org.name}
              </DropdownListItem>
            );
          })}
        </DropdownList>
        {canCreateOrg && (
          <DropdownList border="top">
            <DropdownListItem>
              <TextLink testId="sidepanel-create-org-link" onClick={createNewOrg}>
                <Flex alignItems="center">
                  <Icon className={css({ marginRight: tokens.spacingXs })} icon="PlusCircle" />
                  Create organization
                </Flex>
              </TextLink>
            </DropdownListItem>
          </DropdownList>
        )}
      </Dropdown>
    </>
  );
}
