import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import { Tooltip } from '@contentful/forma-36-react-components';

import { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import UserFetcher from 'components/shared/UserFetcher/index.es6';
import UserNameFormatter from 'components/shared/UserNameFormatter/index.es6';

class Collaborators extends Component {
  static propTypes = {
    users: PropTypes.arrayOf(
      PropTypes.shape({
        sys: PropTypes.shape({
          id: PropTypes.string.isRequired
        }).isRequired
      })
    ).isRequired,
    extraClassNames: PropTypes.string,
    shape: PropTypes.oneOf(['circle', 'rect'])
  };

  static defaultProps = {
    users: [],
    shape: 'circle'
  };
  render() {
    return (
      <ul className={cn('collaborators', this.props.extraClassNames)}>
        {this.props.users.map(({ sys: { id } }) => {
          return (
            <li key={id} className={cn('collaborators__item')}>
              <UserFetcher userId={id}>
                {({ isLoading, isError, data: user }) => {
                  if (isLoading) {
                    return <FetcherLoading />;
                  }
                  if (isError) {
                    return null;
                  }
                  return (
                    <Tooltip content={<UserNameFormatter user={user} />}>
                      <img
                        className={cn('collaborators__avatar', {
                          'collaborators__avatar-circle': this.props.shape === 'circle',
                          'collaborators__avatar-rect': this.props.shape === 'rect'
                        })}
                        src={user.avatarUrl}
                      />
                    </Tooltip>
                  );
                }}
              </UserFetcher>
            </li>
          );
        })}
      </ul>
    );
  }
}

export default Collaborators;
