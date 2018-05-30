import React from 'react';
import PropTypes from 'prop-types';

import spaceContext from 'spaceContext';

export default class FetchEntry extends React.Component {
  static propTypes = {
    node: PropTypes.object,
    render: PropTypes.func.isRequired
  };
  state = {
    entry: {
      sys: {
        contentType: {
          sys: {}
        }
      },
      fields: {}
    }
  };
  componentDidMount () {
    this.fetchEntry(this.props);
  }
  componentWillReceiveProps (nextProps) {
    if (this.props.node !== nextProps.node) {
      this.fetchEntry(nextProps);
    }
  }

  async fetchEntry (props) {
    // TODO: Handle error & pending states
    const entry = await fetchEntry(props.node.data.get('sys').id);
    this.setState({ entry });
  }
  render () {
    return this.props.render(this.state);
  }
}

function fetchEntry (entryId) {
  return spaceContext.cma.getEntry(entryId);
}
