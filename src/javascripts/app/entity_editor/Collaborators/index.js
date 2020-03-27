import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';
import { Tooltip } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { FetcherLoading } from 'app/common/createFetcherComponent';
import UserFetcher from 'components/shared/UserFetcher';
import UserNameFormatter from 'components/shared/UserNameFormatter';

const styles = {
  collaborators: css({
    display: ['-webkit-box', '-ms-flexbox', 'flex'],
    msFlexWrap: 'nowrap',
    flexWrap: 'nowrap',
  }),
  collaboratorsItem: css({ overflow: 'hidden', marginLeft: tokens.spacingXs }),
  collaboratorsAvatar: css({ display: 'block', width: '30px', height: '30px' }),
  collaboratorsAvatarCircle: css({ borderRadius: '50%' }),
  collaboratorsAvatarRect: css({ borderRadius: '3px' }),
  collaboratorsItemFlex: css({
    display: ['-webkit-box', '-ms-flexbox', 'flex'],
    msFlexPack: 'justify',
    WebkitBoxPack: 'justify',
    justifyContent: 'space-between',
    msFlexAlign: 'center',
    WebkitBoxAlign: 'center',
    alignItems: 'center',
  }),
};

class Collaborators extends Component {
  static propTypes = {
    users: PropTypes.arrayOf(
      PropTypes.shape({
        sys: PropTypes.shape({
          id: PropTypes.string.isRequired,
        }).isRequired,
      })
    ).isRequired,
    className: PropTypes.string,
    shape: PropTypes.oneOf(['circle', 'rect']),
  };

  static defaultProps = {
    users: [],
    shape: 'circle',
  };
  render() {
    return (
      <ul className={cx(styles.collaborators, this.props.className)}>
        {this.props.users.map(({ sys: { id } }) => {
          return (
            <li key={id} className={styles.collaboratorsItem}>
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
                        className={cx(
                          styles.collaboratorsAvatar,
                          this.props.shape === 'circle'
                            ? styles.collaboratorsAvatarCircle
                            : styles.collaboratorsAvatarRect
                        )}
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
