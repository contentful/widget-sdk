import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Spinner, Icon } from '@contentful/forma-36-react-components';

import spaceContext from 'spaceContext';

import { createPubSub } from './PubNubClient.es6';
import {
  normalizeMessage,
  isOutOfOrder,
  isDuplicate,
  messageToState,
  EVENT_TRIGGERED,
  EVENT_TRIGGER_FAILED
} from './MessageProcessor.es6';

export default class NetlifyBuildButton extends Component {
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
      <React.Fragment>
        <Button disabled={!ready || busy} loading={busy} isFullWidth onClick={this.build}>
          {busy && status ? status : 'Build with Netlify'}
        </Button>
        {misconfigured && (
          <div className="entity-sidebar__preview__build-info">
            <Icon icon="Warning" size="small" color="negative" />
            <p>Check Netlify App configuration!</p>
          </div>
        )}
        {info && (
          <div className="entity-sidebar__preview__build-info">
            {busy && <Spinner size="small" />}
            {!busy && ok && <Icon icon="InfoCircle" size="small" color="muted" />}
            {!busy && !ok && <Icon icon="Warning" size="small" color="negative" />}
            <p>{info}</p>
          </div>
        )}
      </React.Fragment>
    );
  }
}
