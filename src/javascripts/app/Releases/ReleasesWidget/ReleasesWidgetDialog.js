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
  getReleasesExcludingEntity,
  getReleasesIncludingEntity,
} from '../releasesService';
import { SET_RELEASES_INCLUDING_ENTRY } from '../state/actions';
import { ReleasesProvider } from './ReleasesContext';
import { ReleasesDialog, CreateReleaseForm } from '../ReleasesDialog';

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
    }).isRequired,
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
  };

  async componentDidMount() {
    const { id, type } = this.props.rootEntity.sys;
    const fetchedReleases = await getReleasesExcludingEntity(id, type);
    this.setState({ fetchedReleases: fetchedReleases.items });
  }

  handleCreateRelease(releaseName) {
    const { releaseContentTitle, selectedEntities } = this.props;
    const uniqueSelectedEntities = uniqWith(selectedEntities, isEqual);

    return createRelease(releaseName, uniqueSelectedEntities)
      .then(() => {
        Notification.success(`${releaseContentTitle} was sucessfully added to ${releaseName}`);
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

  onReleaseSelect(release) {
    const { releaseContentTitle } = this.props;

    this.onClose();
    Notification.success(`${releaseContentTitle} was sucessfully added to ${release.title}`);
  }

  onSubmit = (releaseName, dispatch) => {
    if (releaseName) {
      this.handleCreateRelease(releaseName).then(async () => {
        const { id, type } = this.props.rootEntity.sys;
        const fetchedReleases = await getReleasesIncludingEntity(id, type);

        dispatch({ type: SET_RELEASES_INCLUDING_ENTRY, value: fetchedReleases.items });

        this.onClose();
      });
    }
  };

  tabs = {
    existing: {
      title: 'Add to existing',
      render: () => {
        if (this.state.fetchedReleases.length) {
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
        title="Add to a Content Release"
        onClose={this.onClose}
        showTabs={true}
      />
    );
  }
}
