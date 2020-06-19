import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEqual, uniqWith } from 'lodash';
import {
  Notification,
  SkeletonContainer,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import ReleasesTimeline from './ReleasesTimeline';
import {
  createRelease,
  getReleases,
  getReleasesExcludingEntity,
  getReleasesIncludingEntity,
  replaceReleaseById,
} from '../releasesService';
import { SET_RELEASES_INCLUDING_ENTRY } from '../state/actions';
import { ReleasesProvider } from './ReleasesContext';
import { ReleasesDialog, CreateReleaseForm } from '../ReleasesDialog';
import { ReleaseDetailStateLink } from '../ReleasesPage/ReleasesListDialog';
import { css } from 'emotion';

const styles = {
  notification: css({
    display: 'flex',
    justifyContent: 'space-between',
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
  };

  static defaultProps = {
    onCancel() {},
  };

  state = {
    fetchedReleases: [],
    isFetchingReleases: false,
  };

  async componentDidMount() {
    const { rootEntity } = this.props;
    this.setState({ isFetchingReleases: true });
    const fetchedReleases = rootEntity
      ? await getReleasesExcludingEntity(rootEntity.sys.id, rootEntity.sys.type)
      : await getReleases();
    this.setState({ fetchedReleases: fetchedReleases.items, isFetchingReleases: false });
  }

  handleCreateRelease(releaseName) {
    const { releaseContentTitle, selectedEntities, rootEntity } = this.props;
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
      })
      .catch(() => {
        Notification.error(`Failed creating ${releaseName}`);
      });
  }

  handleTabChange(newTab) {
    this.setState({ selectedTab: newTab });
  }

  onClose() {
    this.props.onCancel();
  }

  async onReleaseSelect(release) {
    const { releaseContentTitle, rootEntity, selectedEntities } = this.props;

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
          const { id, type } = rootEntity.sys;
          const fetchedReleases = await getReleasesIncludingEntity(id, type);

          dispatch({ type: SET_RELEASES_INCLUDING_ENTRY, value: fetchedReleases.items });
        }

        this.onClose();
      });
    }
  };

  tabs = {
    existing: {
      title: 'Add to existing',
      render: () => {
        if (!this.state.isFetchingReleases) {
          return (
            <ReleasesTimeline
              releases={this.state.fetchedReleases}
              onReleaseSelect={this.onReleaseSelect}
            />
          );
        }
        return (
          <SkeletonContainer svgHeight={60}>
            <SkeletonBodyText numberOfLines={1} />
            <SkeletonBodyText numberOfLines={1} offsetTop={20} />
            <SkeletonBodyText numberOfLines={1} offsetTop={40} />
          </SkeletonContainer>
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
    const contentTitle = (
      <span>
        Add <b>&apos;{releaseContentTitle}&apos;</b> into a content release:
      </span>
    );

    return (
      <ReleasesDialog
        releaseContentTitle={contentTitle}
        tabs={this.tabs}
        defaultTab={'existing'}
        title="Add to a release"
        onClose={this.onClose}
        showTabs={true}
      />
    );
  }
}
