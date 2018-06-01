import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import FetchEntry from './FetchEntry';

import { goToSlideInEntity } from 'states/EntityNavigationHelpers';

export default class LinkedEntryBlock extends React.Component {
  static propTypes = {
    isSelected: PropTypes.bool.isRequired,
    attributes: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired,
    children: PropTypes.node
  };

  handleClick = entry => {
    goToSlideInEntity({
      id: entry.sys.id,
      type: 'Entry'
    }, 2);
  };

  render () {
    const { node, attributes, isSelected, children } = this.props;

    return (
      <FetchEntry
        node={node}
        render={({ entry }) => {
          return (
            entry && (
              <div
                {...attributes}
                className={cn('entity-link', {
                  'entity-link--selected': isSelected
                })}
                onClick={() => this.handleClick(entry)}
              >
                <div className="entity-link-content">
                  <div
                    style={{
                      flex: '1 1 auto',
                      lineHeight: '1.5',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        color: '#8091A5'
                      }}
                    >
                      {entry.sys.contentType.sys.id}
                    </div>
                    <div
                      style={{
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {entry.fields.title && entry.fields.title['en-US']}
                    </div>
                    {children}
                  </div>
                </div>
              </div>
            )
          );
        }}
      />
    );
  }
}
