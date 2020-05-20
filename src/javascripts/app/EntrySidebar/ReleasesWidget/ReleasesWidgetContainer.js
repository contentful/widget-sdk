import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes';
import SidebarWidgetTypes from '../SidebarWidgetTypes';
import ReleasesTimeline from './ReleasesTimeline';
import EntrySidebarWidget from '../EntrySidebarWidget';
import * as LD from 'utils/LaunchDarkly';
import { ADD_TO_RELEASE } from 'featureFlags';
import { getReleases } from './releasesService';

export default class ReleasesWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired,
  };

  state = {
    featureEnabled: false,
    fetchedReleases: [],
  };

  async componentDidMount() {
    this.props.emitter.emit(SidebarEventTypes.WIDGETREGISTERED, SidebarWidgetTypes.RELEASES);
    const featureEnabled = await LD.getCurrentVariation(ADD_TO_RELEASE);
    let fetchedReleases = [];
    if (featureEnabled) {
      fetchedReleases = await getReleases();
    }
    this.setState({ featureEnabled, fetchedReleases });
  }

  render() {
    const { featureEnabled, fetchedReleases } = this.state;
    if (!featureEnabled || !fetchedReleases.length) {
      return null;
    }

    return (
      <EntrySidebarWidget title="Releases" testId="sidebar-releases-section">
        <ReleasesTimeline releases={fetchedReleases} />
      </EntrySidebarWidget>
    );
  }
}
