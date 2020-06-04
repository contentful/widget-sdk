import React, { Component, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes';
import EntrySidebarWidget from 'app/EntrySidebar/EntrySidebarWidget';
import ReleasesTimeline from './ReleasesTimeline';
import * as LD from 'utils/LaunchDarkly';
import { ADD_TO_RELEASE } from 'featureFlags';
import { getReleasesIncludingEntity } from '../releasesService';
import { ReleasesProvider, ReleasesContext } from './ReleasesContext';
import { SET_RELEASES_INCLUDING_ENTRY } from '../state/actions';
import { releaseDetailNavigation } from '../ReleaseDetail/utils';

const ReleasesWidget = ({ entityInfo }) => {
  const { state, dispatch } = useContext(ReleasesContext);

  useEffect(() => {
    const { id, type } = entityInfo;

    async function fetchReleases() {
      const fetchedReleases = await getReleasesIncludingEntity(id, type);

      dispatch({ type: SET_RELEASES_INCLUDING_ENTRY, value: fetchedReleases.items });
    }

    fetchReleases();
  }, [entityInfo, dispatch]);

  const onReleaseSelect = (release) => {
    releaseDetailNavigation(release);
  };

  if (!state.releasesIncludingEntity.length) {
    return null;
  }

  return (
    <EntrySidebarWidget title="Releases" testId="sidebar-releases-section">
      <ReleasesTimeline
        releases={state.releasesIncludingEntity}
        onReleaseSelect={onReleaseSelect}
      />
    </EntrySidebarWidget>
  );
};

ReleasesWidget.propTypes = {
  entityInfo: PropTypes.object.isRequired,
};

export default class ReleasesWidgetContainer extends Component {
  constructor(props) {
    super(props);
    this.onUpdateReleasesWidget = this.onUpdateReleasesWidget.bind(this);
  }

  static propTypes = {
    emitter: PropTypes.object.isRequired,
  };

  state = {
    featureEnabled: false,
    entityInfo: undefined,
  };

  async componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_RELEASES_WIDGET, this.onUpdateReleasesWidget);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.RELEASES);

    const featureEnabled = await LD.getCurrentVariation(ADD_TO_RELEASE);
    this.setState({ featureEnabled });
  }

  componentWillUnmount() {
    this.props.emitter.off(SidebarEventTypes.UPDATED_RELEASES_WIDGET, this.onUpdateReleasesWidget);
  }

  async onUpdateReleasesWidget({ entityInfo }) {
    this.setState({ entityInfo });
  }

  render() {
    const { featureEnabled, entityInfo } = this.state;

    if (!featureEnabled || !entityInfo) {
      return null;
    }

    return (
      <ReleasesProvider>
        <ReleasesWidget entityInfo={entityInfo} />
      </ReleasesProvider>
    );
  }
}
