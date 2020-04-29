import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';
import { Tooltip, List, ListItem } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { FetcherLoading } from 'app/common/createFetcherComponent';
import { ActionPerformer } from 'move-to-core/components/ActionPerformer';

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
      <List className={cx(styles.collaborators, this.props.className)}>
        {this.props.users.map((user) => {
          return (
            <ListItem key={user.sys.id} className={styles.collaboratorsItem}>
              <ActionPerformer loadingComponent={<FetcherLoading />} link={user}>
                {({ actionPerformer, formattedName }) => {
                  if (!actionPerformer) {
                    return null;
                  }
                  return (
                    <Tooltip place="top" content={formattedName}>
                      <img
                        className={cx(
                          styles.collaboratorsAvatar,
                          this.props.shape === 'circle'
                            ? styles.collaboratorsAvatarCircle
                            : styles.collaboratorsAvatarRect
                        )}
                        src={actionPerformer.avatarUrl}
                      />
                    </Tooltip>
                  );
                }}
              </ActionPerformer>
            </ListItem>
          );
        })}
      </List>
    );
  }
}

export default Collaborators;
