import React, { Component } from 'react';
import { css } from 'emotion';

import {
  Card,
  Icon,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Button,
  Heading,
  Paragraph,
  Notification,
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';

import { formatPastDate } from 'app/Apps/management/util';
import { ActionPerformerName } from 'core/components/ActionPerformerName';
import { deleteRelease } from '../releasesService';

const styles = {
  card: css({
    alignItems: 'center',
    display: 'flex',
    padding: 0,
  }),
  dropdownButton: css({
    height: tokens.spacingXl,
  }),
  dropdown: css({
    marginLeft: 'auto',
  }),
  paragraph: css({
    fontSize: tokens.fontSizeS,
    textTransform: 'uppercase',
  }),
  releaseIcon: css({
    marginRight: tokens.spacing2Xs,
  }),
};

export default class Release extends Component {
  constructor(props) {
    super(props);

    this.deleteRelease = this.deleteRelease.bind(this);
  }

  static propTypes = {
    onDeleteRelease: PropTypes.func.isRequired,
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
  };

  state = {
    isDropdownOpen: false,
  };

  getItemsCountByLinkType = (release, linkType) =>
    release.entities.items.filter((item) => item.sys.linkType === linkType).length;

  deleteRelease() {
    const { release, onDeleteRelease } = this.props;

    deleteRelease(release.sys.id)
      .then(() => {
        Notification.success(`${release.title} was sucessfully deleted.`);
        onDeleteRelease();
      })
      .catch(() => {
        Notification.error(`Failed deleting ${release.title}`);
      });
  }

  handleClick(event) {
    event.stopPropagation();
    this.setState({ isDropdownOpen: !this.state.isDropdownOpen });
  }

  render() {
    const { release } = this.props;
    const assets = this.getItemsCountByLinkType(release, 'Asset');
    const entries = this.getItemsCountByLinkType(release, 'Entry');

    return (
      <Card testId="release-card">
        <div className={styles.card}>
          <Icon icon="Release" color="secondary" className={styles.releaseIcon} />
          <Paragraph className={styles.paragraph}>
            Content Release - {entries} entries, {assets} assets
          </Paragraph>
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
            <DropdownList onClick={(event) => event.stopPropagation()}>
              <DropdownListItem onClick={this.deleteRelease} testId="release-card-delete-cta">
                Delete
              </DropdownListItem>
              <DropdownListItem isDisabled>
                Create {formatPastDate(release.sys.createdAt)}
                {' by '}
                <ActionPerformerName link={release.sys.createdBy} />
              </DropdownListItem>
            </DropdownList>
          </Dropdown>
        </div>
        <div>
          <Heading element="h2">{release.title}</Heading>
        </div>
      </Card>
    );
  }
}
