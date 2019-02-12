import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import VersionsWidget from './VersionsWidget.es6';
import * as SnapshotDecorator from 'app/snapshots/helpers/SnapshotDecorator.es6';

const spaceContext = getModule('spaceContext');
export const PREVIEW_COUNT = 7;

export default class VersionsWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      versions: [],
      publishedVersion: null,
      entryId: null,
      error: null
    };
  }

  componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_VERSIONS_WIDGET, this.onUpdateVersionsWidget);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.VERSIONS);
  }

  componentWillUnmount() {
    this.props.emitter.off(SidebarEventTypes.UPDATED_VERSIONS_WIDGET, this.onUpdateVersionsWidget);
  }

  onUpdateVersionsWidget = ({ entrySys, publishedVersion }) => {
    if (this.state.publishedVersion !== publishedVersion) {
      this.setState({ publishedVersion });
      spaceContext.cma
        .getEntrySnapshots(entrySys.id, { limit: PREVIEW_COUNT })
        .then(res => res.items)
        .then(versions => {
          this.onLoad(versions, entrySys);
        })
        .catch(error => {
          this.onError(error, entrySys);
        });
    } else {
      this.onUpdate(entrySys);
    }
  };

  onUpdate = entrySys => {
    this.onLoad(this.state.versions, entrySys, this.state.error);
  };

  onLoad = (versions, entrySys, error = null) => {
    const versionsWithCurrent = SnapshotDecorator.withCurrent(entrySys, versions);
    this.setState({
      isLoaded: true,
      versions: versionsWithCurrent,
      entryId: entrySys.id,
      error
    });
  };

  onError = (_error, entrySys) => {
    this.setState({
      error: 'There was a problem loading the versions of this entry.',
      entryId: entrySys.id,
      isLoaded: true
    });
  };

  render() {
    return (
      <VersionsWidget
        error={this.state.error}
        entryId={this.state.entryId}
        versions={this.state.versions}
        isLoaded={this.state.isLoaded}
      />
    );
  }
}
