import React, { Component } from 'react';
import { css } from 'emotion';

import {
  Tag,
  Card,
  Icon,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Button,
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';

import { formatPastDate } from 'app/Apps/management/util';
import { ActionPerformerName } from 'core/components/ActionPerformerName';

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
};

export default class Release extends Component {
  static propTypes = {
    release: PropTypes.shape({
      title: PropTypes.string,
      assets: PropTypes.array,
      entries: PropTypes.array,
      sys: PropTypes.shape({
        createdAt: PropTypes.string,
        createdBy: PropTypes.shape({
          type: PropTypes.string,
          linkType: PropTypes.string,
          id: PropTypes.string,
        }),
      }),
    }),
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

  render() {
    const { release } = this.props;
    return (
      <Card className={styles.card}>
        <Icon icon="Release" color="secondary" className={styles.icon} />
        <Tag testId="release-item" tagType="muted">
          {release.title}
        </Tag>
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
          <DropdownList>
            <DropdownListItem>
              Contains {this.getItemsCountByLinkType(release, 'Entry')} entries and{' '}
              {this.getItemsCountByLinkType(release, 'Asset')} assets
            </DropdownListItem>
            <DropdownListItem isDisabled>
              Create {formatPastDate(release.sys.createdAt)}
              {' by '}
              <ActionPerformerName link={release.sys.createdBy} />
            </DropdownListItem>
          </DropdownList>
        </Dropdown>
      </Card>
    );
  }
}
