import React from 'react';
import PropTypes from 'prop-types';
import { EntityType } from '../constants.es6';
import fetchLinks from 'app/entity_editor/Components/FetchLinksToEntity/fetchLinks.es6';
import {
  onFetchLinks as trackFetchLinks,
  Origin as IncomingLinksOrigin
} from 'analytics/events/IncomingLinks.es6';

export const RequestState = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error'
};

class FetchLinksToEntity extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf([EntityType.ASSET, EntityType.ENTRY]).isRequired,
    origin: PropTypes.oneOf([IncomingLinksOrigin.DIALOG, IncomingLinksOrigin.SIDEBAR]),
    render: PropTypes.func.isRequired
  };

  state = {
    links: [],
    requestState: RequestState.PENDING
  };

  componentDidMount() {
    this.fetchLinks(this.props);
  }

  UNSAFE_componentWillReceiveProps = nextProps => {
    if (this.props.id !== nextProps.id) {
      this.fetchLinks(nextProps);
    }
  };

  fetchLinks = ({ id, type }) => {
    fetchLinks(id, type).then(
      links => {
        this.setState(() => ({
          links,
          requestState: RequestState.SUCCESS
        }));
        if (this.props.origin === IncomingLinksOrigin.SIDEBAR) {
          trackFetchLinks({
            entityId: this.props.id,
            entityType: this.props.type,
            incomingLinksCount: links.length
          });
        }
      },
      () => {
        this.setState(() => ({
          links: [],
          requestState: RequestState.ERROR
        }));
      }
    );
  };

  render() {
    return this.props.render(this.state);
  }
}

export default FetchLinksToEntity;
