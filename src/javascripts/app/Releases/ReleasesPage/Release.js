import React, { Component, useState, useEffect } from 'react';
import { css } from 'emotion';
import pluralize from 'pluralize';

import {
  Card,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Button,
  Subheading,
  Paragraph,
  Notification,
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import TheLocaleStore from 'services/localeStore';

import * as EntityResolver from 'data/CMA/EntityResolver';
import { formatPastDate } from 'app/Apps/management/util';
import { ActionPerformerName } from 'core/components/ActionPerformerName';
import { deleteRelease } from '../releasesService';

const getHexOutOfString = (str) =>
  (parseInt(parseInt(str, 36).toExponential().slice(2, -5), 10) & 0xffffff)
    .toString(16)
    .toUpperCase();

const styles = {
  card: css({
    alignItems: 'center',
    display: 'inline-block',
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
    marginLeft: tokens.spacingXs,
  }),
  releaseIcon: css({
    marginRight: tokens.spacing2Xs,
    alignSelf: 'center',
  }),
  headingContainer: css({
    padding: tokens.spacingXs,
  }),
  actionHeading: css({
    display: 'flex',
    alignItems: 'center',
  }),
  textOverlay: css({
    width: '100%',
    height: '100%',
    color: 'rgba(255,255,255,.5)',
    textAlign: 'center',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,.2)',
    fontWeight: 'bold',
    overflow: 'hidden',
  }),
  releaseImage: (images, id) =>
    css({
      width: 250,
      height: 150,
      background: images ? `url(${images[0]}?w=250&h=150)` : `#${getHexOutOfString(id)}`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
};

const ReleaseImage = ({ release }) => {
  const [images, setImages] = useState(null);
  useEffect(() => {
    const assets = release.entities.items.filter((item) => item.sys.linkType === 'Asset');
    if (images) {
      return undefined;
    }
    if (assets.length) {
      EntityResolver.fetchForType(
        'Asset',
        assets.map((asset) => asset.sys.id)
      ).then((images) => {
        const defaultLocale = TheLocaleStore.getDefaultLocale();
        const srcFiles = images.map(
          (image) => image.fields.file && image.fields.file[defaultLocale.code].url
        );
        setImages(srcFiles);
      });
    }
  });
  return (
    <div className={styles.releaseImage(images, release.sys.id)}>
      {!images && <div className={styles.textOverlay}>{release.title}</div>}
    </div>
  );
};

ReleaseImage.propTypes = {
  release: PropTypes.shape({
    title: PropTypes.string,
    sys: PropTypes.shape({
      id: PropTypes.string,
    }),
    entities: PropTypes.shape({
      items: PropTypes.arrayOf({
        sys: PropTypes.shape({
          id: PropTypes.string,
        }),
      }),
    }),
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
    const assets = this.getItemsCountByLinkType(release, 'Asset') || null;
    const entries = this.getItemsCountByLinkType(release, 'Entry') || null;

    return (
      <Card testId="release-card" className={styles.card}>
        <ReleaseImage release={release} />
        <div>
          <div className={styles.headingContainer}>
            <div className={styles.actionHeading}>
              <Subheading element="h2">{release.title}</Subheading>
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
                  <DropdownListItem onClick={this.deleteRelease} testId="release-card-delete-cta">
                    Delete
                  </DropdownListItem>
                  <DropdownListItem isDisabled>
                    Created {formatPastDate(release.sys.createdAt)}
                    {' by '}
                    <ActionPerformerName link={release.sys.createdBy} />
                  </DropdownListItem>
                </DropdownList>
              </Dropdown>
            </div>
            <Paragraph>
              {entries && pluralize('entry', entries, true)}
              {entries && assets && ', '}
              {assets && pluralize('asset', assets, true)}
              {!entries && !assets && 'Empty'}
            </Paragraph>
          </div>
        </div>
      </Card>
    );
  }
}
