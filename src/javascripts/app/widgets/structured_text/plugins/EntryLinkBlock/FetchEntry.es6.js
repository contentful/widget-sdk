import React from 'react';
import PropTypes from 'prop-types';

import spaceContext from 'spaceContext';
import * as EntityState from 'data/CMA/EntityState';

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
    try {
      const entry = await getEntry(props.node.data.get('sys').id);
      const thumbnail = await getEntryThumbnail(entry);

      this.setState({
        entry: entry.data,
        entryTitle: getEntryTitle(entry),
        entryDescription: getEntryDescription(entry),
        entryThumbnail: thumbnail,
        entryStatus: getEntryStatus(entry)
      });
    } catch (error) {
      this.setState({
        entryIsMissing: true
      });
    }
  }
  render () {
    return this.props.render(this.state);
  }
}

function getEntryTitle (entry) {
  return spaceContext.entryTitle(entry);
}

function getEntryDescription (entry) {
  return spaceContext.entityDescription(entry);
}

function getEntryStatus (entry) {
  const state = EntityState.getState(entry.data.sys);

  // We do not show the state indicator for published assets
  if (!(entry.data.sys.type === 'Asset' && state === EntityState.State.Published())) {
    return EntityState.stateName(state);
  }
}

function getEntryThumbnail (entry) {
  return spaceContext.entryImage(entry);
}

function getEntry (entryId) {
  return spaceContext.space.getEntry(entryId);
}
