import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';

import spaceContext from 'spaceContext';

import { createPubSub } from './PubNubClient.es6';
import {
  normalizeMessage,
  isOutOfOrder,
  isDuplicate,
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
        this.setState(({ history }) => ({ history: [msg].concat(history) }));
      }
    });

    await this.pubsub.start();

    const history = await this.pubsub.getHistory();
    const filteredHistory = history
      .filter((msg, i, history) => !isOutOfOrder(msg, history.slice(i + 1)))
      .filter((msg, i, history) => !isDuplicate(msg, history.slice(i + 1)));

    this.setState({ history: filteredHistory, ready: true });
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
    return (
      <React.Fragment>
        <Button disabled={!this.state.ready} isFullWidth onClick={this.build}>
          Build with Netlify
        </Button>
        {this.state.misconfigured && <p>Check Netlify App configuration!</p>}
        <pre>{JSON.stringify(this.state.history, null, 2)}</pre>
      </React.Fragment>
    );
  }
}
