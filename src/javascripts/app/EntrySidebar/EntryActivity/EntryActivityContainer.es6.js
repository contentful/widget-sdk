import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { css } from 'emotion';
import { ValidationMessage } from '@contentful/forma-36-react-components';

import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';
import { ENTRY_ACTIVITY } from 'featureFlags.es6';
import Visible from 'components/shared/Visible/index.es6';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.es6';
import * as logger from 'services/logger.es6';

import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';

import { feed as entryActivityFeed } from './stream.es6';
import EntryActivityWidget from './EntryActivityWidget.es6';

const FETCHING_STATUS = {
  REQUEST: 'REQUEST',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
};

export default class EntryActivityContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired,
    bridge: PropTypes.shape({
      getData: PropTypes.func.isRequired,
      apply: PropTypes.func,
      install: PropTypes.func
    }).isRequired
  };

  entryfeed = null;

  state = {
    isFeatureEnabled: false,
    fetchingStatus: FETCHING_STATUS.REQUEST,
    activityFeed: []
  };

  constructor(props) {
    super(props);
    this.previousEntryState = get(this.props.bridge.getData(), 'entryData');
    this.entrySys = this.previousEntryState.sys;
  }

  async setUpFeed() {
    const entryId = get(this.props.bridge.getData(), 'entryData.sys.id');
    const entryfeed = entryActivityFeed(entryId);

    return entryfeed;
  }

  async componentDidMount() {
    const isFeatureEnabled = await getCurrentVariation(ENTRY_ACTIVITY);

    this.setState({ isFeatureEnabled });
    if (!isFeatureEnabled) {
      return;
    }

    this.entryfeed = await this.setUpFeed();

    this.props.emitter.on(SidebarEventTypes.UPDATED_DOCUMENT_STATE, this.onUpdatePublicationWidget);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.ACTIVITY);

    this.entryfeed.subscribe(data => {
      this.setState({ activityFeed: [...data.new, ...this.state.activityFeed] });
    });

    try {
      const activityFeed = await this.entryfeed.getAll();

      this.setState({
        activityFeed,
        fetchingStatus: FETCHING_STATUS.SUCCESS
      });

      if (activityFeed.length === 0) {
        await this.addCreatedEntryActivity();
      }
    } catch (error) {
      this.setState({
        fetchingStatus: FETCHING_STATUS.FAILURE
      });
      logger.logException(error);
    }
  }

  addCreatedEntryActivity = async () => {
    const entrySys = get(this.props.bridge.getData(), 'entryData.sys');
    await this.entryfeed.addActivity({
      foreign_id: `${entrySys.createdBy.sys.id}:${entrySys.id}`,
      user_id: entrySys.createdBy.sys.id,
      object: {},
      verb: 'created',
      time: entrySys.createdAt
    });
  };

  onUpdatePublicationWidget = async verb => {
    const entry = this.props.bridge.getData();
    const userId = get(entry, 'spaceMembership.user.sys.id');
    const entrySys = get(entry, 'entryData.sys');

    await this.entryfeed.addActivity({
      foreign_id: `${userId}:${entrySys.id}`,
      user_id: userId,
      object: {},
      verb
    });
  };

  render() {
    return (
      <ErrorHandler>
        <Visible if={this.state.isFeatureEnabled}>
          <EntrySidebarWidget title="Entry activity">
            {this.state.fetchingStatus === FETCHING_STATUS.REQUEST && (
              <div
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                })}>
                <div className="loading-box__spinner" />
                <div className="loading-box__message">Loading...</div>
              </div>
            )}
            {this.state.fetchingStatus === FETCHING_STATUS.SUCCESS && (
              <EntryActivityWidget activities={this.state.activityFeed} />
            )}

            {this.state.fetchingStatus === FETCHING_STATUS.FAILURE && (
              <div
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                })}>
                <div className="loading-box__message">
                  <ValidationMessage>Error fetching the entry activity</ValidationMessage>
                </div>
              </div>
            )}
          </EntrySidebarWidget>
        </Visible>
      </ErrorHandler>
    );
  }
}
