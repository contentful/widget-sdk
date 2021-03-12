import React, { Component, createRef } from 'react';
import { css } from 'emotion';

import {
  Card,
  Icon,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Button,
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';

import { formatPastDate } from 'features/apps';
import { ActionPerformerName } from 'core/components/ActionPerformerName';
import { Pluralized } from 'core/components/formatting/Pluralized/Pluralized';
import { LaunchAppDeepLink } from 'features/contentful-apps';

const styles = {
  card: css({
    alignItems: 'center',
    display: 'flex',
    padding: `0 0 0 ${tokens.spacingXs}`,
  }),
  dropdownButton: css({
    height: tokens.spacingXl,
  }),
  icon: css({
    marginRight: tokens.spacingXs,
  }),
  dropdown: css({
    marginLeft: 'auto',
  }),
  dropdownList: css({
    padding: 0,
    '> li': css({
      paddingTop: tokens.spacing2Xs,
    }),
  }),
  infoSection: css({
    backgroundColor: tokens.colorElementLight,
    paddingBottom: tokens.spacingS,
    ':hover': css({
      backgroundColor: tokens.colorElementLight,
    }),
  }),
  textTag: css({
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '70%',
    textTransform: 'none',
    color: tokens.colorTextMid,
  }),
  launchDeepLinkDropdownItem: css({
    color: tokens.colorTextLight,
    '&:hover, &:active, &:visited, &:link': {
      color: tokens.colorTextLight,
    },
  }),
};

export default class Release extends Component {
  constructor(props) {
    super(props);

    this.launchAppDeepLinkRef = createRef();
  }

  static propTypes = {
    release: PropTypes.shape({
      title: PropTypes.string,
      assets: PropTypes.array,
      entries: PropTypes.array,
      sys: PropTypes.shape({
        id: PropTypes.string,
        createdAt: PropTypes.string,
        createdBy: PropTypes.shape({
          type: PropTypes.string,
          linkType: PropTypes.string,
          id: PropTypes.string,
        }),
      }),
    }),
    deleteEntityFromRelease: PropTypes.func,
    shouldCardHandleClick: PropTypes.bool,
  };

  state = {
    isDropdownOpen: false,
  };

  getItemsCountByLinkType = (release, linkType) =>
    release.entities.items.filter((item) => item.sys.linkType === linkType).length;

  handleClick(event) {
    event.stopPropagation();
    this.setState({ isDropdownOpen: !this.state.isDropdownOpen });
  }

  handleEntityDeleteFromRelease(release) {
    this.props.deleteEntityFromRelease(release);
    this.setState({ isDropdownOpen: !this.state.isDropdownOpen });
  }

  render() {
    const { release } = this.props;
    const entriesCount = this.getItemsCountByLinkType(release, 'Entry') || 0;
    const assetsCount = this.getItemsCountByLinkType(release, 'Asset') || 0;
    const hasEntries = !!entriesCount;
    const hasAssets = !!assetsCount;

    return (
      <Card
        className={styles.card}
        onClick={
          this.props.shouldCardHandleClick
            ? () => this.setState({ isDropdownOpen: !this.state.isDropdownOpen })
            : undefined
        }>
        <Icon icon="Release" color="secondary" className={styles.icon} />
        <strong testId="release-item" title={release.title} className={styles.textTag}>
          {release.title}
        </strong>
        <Dropdown
          className={styles.dropdown}
          isOpen={this.state.isDropdownOpen}
          position="bottom-right"
          onClose={() => this.setState({ isDropdownOpen: false })}
          toggleElement={
            <Button
              buttonType="naked"
              data-test-id="remove-release-ddl"
              icon="MoreHorizontal"
              className={styles.dropdownButton}
              onClick={(event) => this.handleClick(event)}
            />
          }>
          <DropdownList
            className={styles.dropdownList}
            onClick={(event) => event.stopPropagation()}>
            <DropdownListItem
              onClick={(e) => {
                this.launchAppDeepLinkRef.current?.click(e);
              }}>
              <LaunchAppDeepLink
                className={styles.launchDeepLinkDropdownItem}
                ref={this.launchAppDeepLinkRef}
                withIcon
                iconPosition="left"
                iconSize={16}
                withExternalIcon
                externalIconColor="muted"
                releaseId={release.sys.id}
                eventOrigin="releases-widget">
                View in Launch
              </LaunchAppDeepLink>
            </DropdownListItem>
            {this.props.deleteEntityFromRelease ? (
              <DropdownListItem onClick={() => this.handleEntityDeleteFromRelease(release)}>
                Remove from Release
              </DropdownListItem>
            ) : null}
            <DropdownListItem className={styles.infoSection} isDisabled>
              <div>
                Contains {hasEntries && <Pluralized text="entry" count={entriesCount} />}
                {hasEntries && hasAssets && ', '}
                {hasAssets && <Pluralized text="asset" count={assetsCount} />}
              </div>
              <div>
                Created {formatPastDate(release.sys.createdAt)}
                {' by '}
                <ActionPerformerName link={release.sys.createdBy} />
              </div>
            </DropdownListItem>
          </DropdownList>
        </Dropdown>
      </Card>
    );
  }
}
