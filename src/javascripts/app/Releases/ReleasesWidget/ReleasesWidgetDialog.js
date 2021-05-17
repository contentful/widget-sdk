import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEqual, uniqWith, get as getAtPath } from 'lodash';
import pluralize from 'pluralize';
import {
  Notification,
  SkeletonContainer,
  SkeletonBodyText,
  TextLink,
} from '@contentful/forma-36-react-components';
import EmptyStateIllustration from 'svg/create-compelling-experiences.svg';
import ReleasesTimeline from './ReleasesTimeline';
import { createRelease, getReleases, updateRelease } from '../releasesService';
import { ReleasesProvider } from './ReleasesContext';
import { ReleasesDialog, CreateReleaseForm } from '../ReleasesDialog';
import { css } from 'emotion';
import { fetchReleases } from '../common/utils';
import { RELEASE_ENTITIES_LIMIT } from 'features/releases/constants';
import { track } from 'analytics/Analytics';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { getLaunchAppDeepLink, LaunchAppDeepLinkRaw } from 'features/contentful-apps';

const styles = {
  notification: css({
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  }),
  emptyStateContainer: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '250px',
    margin: 'auto',
  }),
  illustration: css({
    width: '80%',
    height: 'auto',
    opacity: '40%',
  }),
};

const TrackingEvents = {
  DIALOG_OPEN: 'release:dialog_box_open',
  DIALOG_CLOSE: 'release:dialog_box_close',
  ENTITY_ADDED: 'release:entity_added',
};

export default class ReleasesWidgetDialog extends Component {
  constructor(props) {
    super(props);

    this.onClose = this.onClose.bind(this);
    this.onReleaseSelect = this.onReleaseSelect.bind(this);
    this.handleCreateRelease = this.handleCreateRelease.bind(this);
    track(TrackingEvents.DIALOG_OPEN, { purpose: 'create' });
  }

  static contextType = SpaceEnvContext;

  static propTypes = {
    selectedEntities: PropTypes.array,
    rootEntity: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string,
        type: PropTypes.string,
      }),
    }),
    validator: PropTypes.shape({
      run: PropTypes.func,
      setApiResponseErrors: PropTypes.func,
    }),
    onCancel: PropTypes.func.isRequired,
    releaseContentTitle: PropTypes.string,
    handleReleaseRefresh: PropTypes.func,
    excludeEntityReleases: PropTypes.bool,
  };

  static defaultProps = {
    onCancel() {},
    excludeEntityReleases: false,
  };

  state = {
    fetchedReleases: [],
    isFetchingReleases: false,
    selectedTab: 'existing',
  };

  async componentDidMount() {
    const { rootEntity, excludeEntityReleases } = this.props;
    this.setState({ isFetchingReleases: true });
    const fetchedReleases = await getReleases();
    const releases =
      rootEntity && excludeEntityReleases
        ? fetchedReleases.items.filter(
            (release) =>
              !release.entities.items.find(
                (entity) =>
                  entity.sys.id === rootEntity.sys.id && entity.sys.linkType === rootEntity.sys.type
              )
          )
        : fetchedReleases.items;
    this.setState({ fetchedReleases: releases, isFetchingReleases: false });
  }

  handleCreateRelease(releaseName) {
    const { selectedEntities } = this.props;
    const uniqueSelectedEntities = uniqWith(selectedEntities, isEqual);

    return createRelease(releaseName, uniqueSelectedEntities)
      .then((release) => {
        this.handleSuccess(release);
      })
      .catch(() => {
        Notification.error(`Failed creating ${releaseName}`);
      });
  }

  handleSuccess(release) {
    const { releaseContentTitle, handleReleaseRefresh, selectedEntities } = this.props;
    const uniqueSelectedEntities = uniqWith(selectedEntities, isEqual);
    const predicate = pluralize('was', uniqueSelectedEntities.length);

    handleReleaseRefresh && handleReleaseRefresh();

    const assetCount =
      uniqueSelectedEntities.filter((entity) => entity.sys.type === 'Asset').length || 0;
    const entryCount =
      uniqueSelectedEntities.filter((entity) => entity.sys.type === 'Entry').length || 0;

    track(TrackingEvents.ENTITY_ADDED, {
      assetCount,
      entryCount,
      releaseId: release.sys.id,
    });

    const { currentSpaceId, currentEnvironmentId, currentEnvironmentAliasId } = this.context;
    const href = getLaunchAppDeepLink(
      currentSpaceId,
      currentEnvironmentAliasId || currentEnvironmentId,
      release.sys.id
    );

    Notification.success(
      <div className={styles.notification}>
        <span>
          {releaseContentTitle} {predicate} successfully added to {release.title}
        </span>
        <LaunchAppDeepLinkRaw
          href={href}
          eventOrigin="releases-widget"
          withIcon
          iconSize={16}
          withExternalIcon
          iconPosition="left">
          View Release
        </LaunchAppDeepLinkRaw>
      </div>
    );
  }

  handleTabChange = (newTab) => {
    this.setState({ selectedTab: newTab });
  };

  onClose(success = false) {
    track(TrackingEvents.DIALOG_CLOSE, { purpose: success ? 'submit' : 'cancel' });
    this.props.onCancel();
  }

  async onReleaseSelect(release) {
    const { releaseContentTitle, selectedEntities } = this.props;

    try {
      const releaseItems = [
        ...release.entities.items,
        ...selectedEntities.map(({ sys }) => ({
          sys: {
            type: 'Link',
            linkType: sys.type,
            id: sys.id,
          },
        })),
      ];

      await updateRelease(release, { items: releaseItems });

      this.handleSuccess(release);
    } catch (error) {
      const errorId = getAtPath(error, 'data.sys.id');
      if (errorId === 'ValidationFailed') {
        const validationErrors = getAtPath(error, 'data.details.errors');
        const validationErrorDetails = validationErrors.find((err) => err.name === 'size');
        if (validationErrors.length && validationErrorDetails) {
          Notification.error(
            `Sorry, we couldn’t add any more entities to this release as it exceeds the limit of
            ${RELEASE_ENTITIES_LIMIT}. You might consider creating a new release to accommodate the additional entities.`,
            {
              title: 'Entity limit reached',
            }
          );
        } else {
          Notification.error(
            `Failed adding ${releaseContentTitle} to ${release.title}: Some entities did not pass validation`
          );
        }
      } else {
        Notification.error(`Failed adding ${releaseContentTitle} to ${release.title}`);
      }
    }

    this.onClose(true);
  }

  onSubmit = (releaseName, dispatch) => {
    if (releaseName) {
      this.handleCreateRelease(releaseName).then(async () => {
        const { rootEntity } = this.props;
        if (rootEntity) {
          fetchReleases(rootEntity.sys, dispatch);
        }
        this.onClose(true);
      });
    }
  };

  tabs = {
    existing: {
      title: 'Add to existing',
      render: () => {
        if (this.state.isFetchingReleases) {
          return (
            <SkeletonContainer svgHeight={60}>
              <SkeletonBodyText numberOfLines={1} />
              <SkeletonBodyText numberOfLines={1} offsetTop={20} />
              <SkeletonBodyText numberOfLines={1} offsetTop={40} />
            </SkeletonContainer>
          );
        }

        if (this.state.fetchedReleases.length) {
          return (
            <ReleasesTimeline
              releases={this.state.fetchedReleases}
              onReleaseSelect={this.onReleaseSelect}
            />
          );
        }

        return (
          <div className={styles.emptyStateContainer}>
            <EmptyStateIllustration className={styles.illustration} />
            You do not have any releases yet.
            <TextLink onClick={() => this.handleTabChange('new')}>Create a new release</TextLink>
          </div>
        );
      },
    },
    new: {
      title: '+ Create new',
      render: () => {
        return (
          <ReleasesProvider>
            <CreateReleaseForm
              onClose={this.onClose}
              onSubmit={this.onSubmit}
              buttonText="Create and Add"
            />
          </ReleasesProvider>
        );
      },
    },
  };

  render() {
    const { releaseContentTitle } = this.props;
    const { selectedTab } = this.state;
    const contentTitle = (
      <span>
        Add <b>&apos;{releaseContentTitle}&apos;</b> into a content release:
      </span>
    );

    return (
      <ReleasesDialog
        releaseContentTitle={contentTitle}
        tabs={this.tabs}
        defaultTab={selectedTab}
        title="Add to a release"
        onClose={this.onClose}
        showTabs={true}
        handleTabChange={this.handleTabChange}
      />
    );
  }
}
