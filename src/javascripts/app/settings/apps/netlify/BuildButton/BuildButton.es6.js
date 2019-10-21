import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, ValidationMessage } from '@contentful/forma-36-react-components';

import * as Analytics from 'analytics/Analytics';
import FeedbackButton from 'app/common/FeedbackButton.es6';

import { createPubSub } from './PubNubClient.es6';
import {
  normalizeMessage,
  isOutOfOrder,
  isDuplicate,
  messageToState,
  EVENT_TRIGGERED,
  EVENT_TRIGGER_FAILED
} from './MessageProcessor.es6';
import { getModule } from 'NgRegistry.es6';
import styles from './styles.es6';

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
    const spaceContext = getModule('spaceContext');

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
    const spaceContext = getModule('spaceContext');

    this.pubsub.publish({
      contentful: true,
      event: EVENT_TRIGGERED,
      userId: spaceContext.user.sys.id
    });

    const res = await window.fetch(this.props.netlifySite.buildHookUrl, { method: 'POST' });

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
      <div>
        <div className={styles.header}>
          <span className={styles.alphaLabel}>Alpha</span>
          <FeedbackButton target="extensibility" about="Netlify Build Button" />
        </div>
        <Button
          disabled={!ready || busy}
          loading={busy}
          isFullWidth
          onClick={this.build}
          className={styles.button}>
          {busy && status ? status : 'Build'}
        </Button>
        {misconfigured && (
          <div className={styles.info}>
            <ValidationMessage>Check Netlify App configuration!</ValidationMessage>
          </div>
        )}
        {info && (
          <div className={styles.info}>
            {ok && info}
            {!ok && <ValidationMessage>{info}</ValidationMessage>}
          </div>
        )}
      </div>
    );
  }
}
