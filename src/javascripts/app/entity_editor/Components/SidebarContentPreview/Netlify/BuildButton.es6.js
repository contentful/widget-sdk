import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';

export default class NetlifyBuildButton extends Component {
  static propTypes = {
    netlifySite: PropTypes.shape({
      buildHookUrl: PropTypes.string.isRequired
    }).isRequired,
    disabled: PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);
  }

  build = async () => {
    const res = await fetch(this.props.netlifySite.buildHookUrl, { method: 'POST' });
    if (!res.ok) {
      this.pubsub.publish({});
    }
  };

  render() {
    return (
      <Button disabled={this.props.disabled} isFullWidth>
        Build with Netlify
      </Button>
    );
  }
}
