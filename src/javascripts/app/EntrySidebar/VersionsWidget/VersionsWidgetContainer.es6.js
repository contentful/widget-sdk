import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import VersionsWidget from './VersionsWidget.es6';
import * as SnapshotDecorator from 'app/snapshots/helpers/SnapshotDecorator.es6';

const spaceContext = getModule('spaceContext');
const PREVIEW_COUNT = 7;

export default class VersionsWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      versions: [],
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

  onUpdateVersionsWidget = ({ entrySys }) => {
    spaceContext.cma
      .getEntrySnapshots(entrySys.id, { limit: PREVIEW_COUNT })
      .then(res => res.items)
      .then(versions => {
        this.onLoad(versions, entrySys);
      })
      .catch(error => {
        this.onError(error);
      });
  };

  onLoad = (versions, entrySys) => {
    const versionsWithCurrent = SnapshotDecorator.withCurrent(entrySys, versions);
    if (
      versionsWithCurrent.length > 1 ||
      (versionsWithCurrent[0] && !versionsWithCurrent[0].sys.isCurrent)
    ) {
      this.setState({
        isLoaded: true,
        versions: versionsWithCurrent,
        entryId: entrySys.id,
        error: null
      });
    } else {
      this.setState({
        isLoaded: true,
        versions: [],
        error: null
      });
    }
  };

  onError = () => {
    this.setState({
      error: 'Failed to load entity snapshots',
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
