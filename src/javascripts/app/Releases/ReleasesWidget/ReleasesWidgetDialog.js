import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEqual, uniqWith } from 'lodash';
import {
  Notification,
  SkeletonContainer,
  SkeletonBodyText,
  TextLink,
} from '@contentful/forma-36-react-components';
import EmptyStateIllustration from 'svg/create-compelling-experiences.svg';
import ReleasesTimeline from './ReleasesTimeline';
import { createRelease, getReleases, replaceReleaseById } from '../releasesService';
import { ReleasesProvider } from './ReleasesContext';
import { ReleasesDialog, CreateReleaseForm } from '../ReleasesDialog';
import { ReleaseDetailStateLink } from '../ReleasesPage/ReleasesListDialog';
import { css } from 'emotion';
import { fetchReleases } from '../common/utils';

const styles = {
  notification: css({
    display: 'flex',
    justifyContent: 'space-between',
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

export default class ReleasesWidgetDialog extends Component {
  constructor(props) {
    super(props);

    this.onClose = this.onClose.bind(this);
    this.onReleaseSelect = this.onReleaseSelect.bind(this);
    this.handleCreateRelease = this.handleCreateRelease.bind(this);
  }

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
  };

  static defaultProps = {
    onCancel() {},
  };

  state = {
    fetchedReleases: [],
    isFetchingReleases: false,
    selectedTab: 'existing',
  };

  async componentDidMount() {
    const { rootEntity } = this.props;
    this.setState({ isFetchingReleases: true });
    const fetchedReleases = await getReleases();
    const releases = rootEntity
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
    const { releaseContentTitle, selectedEntities, rootEntity, handleReleaseRefresh } = this.props;
    const uniqueSelectedEntities = uniqWith(selectedEntities, isEqual);

    return createRelease(releaseName, uniqueSelectedEntities)
      .then((release) => {
        const predicate = rootEntity || uniqueSelectedEntities.length === 1 ? 'was' : 'were';
        Notification.success(
          <div className={styles.notification}>
            <span>
              {releaseContentTitle} {predicate} sucessfully added to {releaseName}
            </span>
            <ReleaseDetailStateLink releaseId={release.sys.id} />
          </div>
        );
        handleReleaseRefresh && handleReleaseRefresh();
      })
      .catch(() => {
        Notification.error(`Failed creating ${releaseName}`);
      });
  }

  handleTabChange = (newTab) => {
    this.setState({ selectedTab: newTab });
  };

  onClose() {
    this.props.onCancel();
  }

  async onReleaseSelect(release) {
    const { releaseContentTitle, rootEntity, selectedEntities, handleReleaseRefresh } = this.props;

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

      await replaceReleaseById(release.sys.id, release.title, releaseItems);
      const predicate = rootEntity || selectedEntities.length === 1 ? 'was' : 'were';
      handleReleaseRefresh && this.props.handleReleaseRefresh();
      Notification.success(
        <div className={styles.notification}>
          <span>
            {releaseContentTitle} {predicate} sucessfully added to {release.title}
          </span>
          <ReleaseDetailStateLink releaseId={release.sys.id} />
        </div>
      );
    } catch (error) {
      Notification.error(`Failed adding ${releaseContentTitle} to ${release.title}`);
    }

    this.onClose();
  }

  onSubmit = (releaseName, dispatch) => {
    if (releaseName) {
      this.handleCreateRelease(releaseName).then(async () => {
        const { rootEntity } = this.props;
        if (rootEntity) {
          fetchReleases(rootEntity.sys, dispatch);
        }
        this.onClose();
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
