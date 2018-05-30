import React from 'react';
import PropTypes from 'prop-types';

import FetchEntry from './FetchEntry';

export default class LinkedEntryBlock extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    attributes: PropTypes.object.isRequired,
    node: PropTypes.object
  };
  render () {
    return (
      <FetchEntry
        node={this.props.node}
        render={({ entry }) => (
          <div
            {...this.props.attributes}
            className="entity-link"
            style={{ padding: '5px', maxHeight: '100px' }}
          >
            <div className="entity-link-content">
              <div style={{ flex: '1 1 auto', overflow: 'hidden' }}>
                <span
                  style={{
                    fontSize: '16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {entry.fields.title && entry.fields.title['en-US']}
                </span>
                <p>Content type id: {entry.sys.contentType.sys.id}</p>
                {this.props.children}
              </div>
            </div>
          </div>
        )}
      />
    );
  }
}
