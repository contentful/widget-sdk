import React from 'react';
import PropTypes from 'prop-types';

import * as EntityState from '../../../../../../data/CMA/EntityState.es6';
import RequestStatus from '../RequestStatus.es6';

const DEFAULT_ENTRY = {
  sys: {
    contentType: {
      sys: {}
    }
  },
  fields: {}
};

export default class FetchEntry extends React.Component {
  static propTypes = {
    node: PropTypes.object,
    currentUrl: PropTypes.string,
    render: PropTypes.func.isRequired,
    $services: PropTypes.shape({
      spaceContext: PropTypes.object
    }).isRequired
  };
  state = {
    entry: DEFAULT_ENTRY,
    requestStatus: RequestStatus.Pending
  };
  componentDidMount() {
    this.fetchEntry();
  }
  componentDidUpdate(prevProps) {
    if (this.props.node !== prevProps.node || this.props.currentUrl !== prevProps.currentUrl) {
      this.fetchEntry();
    }
  }
  fetchEntry = async () => {
    const spaceContext = this.props.$services.spaceContext;

    try {
      this.setState({
        requestStatus: RequestStatus.Pending
      });
      const entryId = this.props.node.data.get('target').sys.id;
      const entry = await spaceContext.space.getEntry(entryId);
      const contentTypeId = entry.data.sys.contentType.sys.id;
      const contentType = await spaceContext.space.getContentType(contentTypeId);

      this.setState({
        entry: entry.data,
        entryWrapper: entry,
        contentTypeName: contentType.data.name,
        entryTitle: spaceContext.entryTitle(entry),
        entryDescription: spaceContext.entityDescription(entry),
        entryStatus: EntityState.stateName(EntityState.getState(entry.data.sys)),
        requestStatus: RequestStatus.Success
      });
    } catch (error) {
      this.setState({
        requestStatus: RequestStatus.Error
      });
    }
  };
  render() {
    return this.props.render(this.state);
  }
}
