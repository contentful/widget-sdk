import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, ValidationMessage } from '@contentful/forma-36-react-components';

import spaceContext from 'spaceContext';
import * as Analytics from 'analytics/Analytics.es6';

import { createPubSub } from './PubNubClient.es6';
import {
  normalizeMessage,
  isOutOfOrder,
  isDuplicate,
  messageToState,
  EVENT_TRIGGERED,
  EVENT_TRIGGER_FAILED
} from './MessageProcessor.es6';

export default class BuildButton extends Component {
  static propTypes = {
    netlifySite: PropTypes.shape({
      channel: PropTypes.string.isRequired,
      netlifySiteId: PropTypes.string.isRequired,
      buildHookUrl: PropTypes.string.isRequired
    }).isRequired
  };

  state = { history: [] };

  async componentDidMount() {
    const site = this.props.netlifySite;
    if (!site.channel || !site.netlifySiteId || !site.buildHookUrl) {
      this.setState({ misconfigured: true });
      return;
    }

    const users = await spaceContext.users.getAll();

    this.pubsub = createPubSub(
      site.channel,
      normalizeMessage.bind(null, site.netlifySiteId, users)
    );

    this.pubsub.addListener(msg => {
      const inOrder = !isOutOfOrder(msg, this.state.history);
      const notDuplicate = !isDuplicate(msg, this.state.history);

      if (inOrder && notDuplicate) {
        this.setState(({ history }) => {
          return {
            history: [msg].concat(history),
            ...messageToState(msg)
          };
        });
      }
    });

    await this.pubsub.start();

    const history = await this.pubsub.getHistory();
    const filteredHistory = history
      .filter((msg, i, history) => !isOutOfOrder(msg, history.slice(i + 1)))
      .filter((msg, i, history) => !isDuplicate(msg, history.slice(i + 1)));

    if (filteredHistory.length > 0) {
      this.setState({
        history: filteredHistory,
        ...messageToState(filteredHistory[0])
      });
    }

    this.setState({ ready: true });
  }

  componentWillUnmount() {
    if (this.pubsub) {
      this.pubsub.stop();
    }
  }

  build = async () => {
    this.pubsub.publish({
      contentful: true,
      event: EVENT_TRIGGERED,
      userId: spaceContext.user.sys.id
    });

    const res = await fetch(this.props.netlifySite.buildHookUrl, { method: 'POST' });

    Analytics.track('netlify:build_triggered');

    if (!res.ok) {
      this.pubsub.publish({
        contentful: true,
        event: EVENT_TRIGGER_FAILED
      });
    }
  };

  render() {
    const { ready, busy, status, misconfigured, info, ok } = this.state;

    return (
      <div className="netlify-app__build-button">
        <Button disabled={!ready || busy} loading={busy} isFullWidth onClick={this.build}>
          {busy && status ? status : 'Build with Netlify'}
        </Button>
        {misconfigured && (
          <div className="netlify-app__build-button__info">
            <ValidationMessage>Check Netlify App configuration!</ValidationMessage>
          </div>
        )}
        {info && (
          <div className="netlify-app__build-button__info">
            {ok && info}
            {!ok && <ValidationMessage>{info}</ValidationMessage>}
          </div>
        )}
      </div>
    );
  }
}
