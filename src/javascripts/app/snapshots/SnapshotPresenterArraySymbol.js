import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { List, ListItem } from '@contentful/forma-36-react-components';

const styles = {
  list: css({
    '& li': {
      fontSize: tokens.fontSizeL,
      marginLeft: tokens.spacingL,
      listStyleType: 'disc',
    },
  }),
};

const SnapshotPresenterArraySymbol = ({ value, className }) => {
  return (
    <div className={className} data-test-id="snapshot-presenter-arraysymbol">
      <List className={styles.list}>
        {value.map((item, i) => (
          <ListItem key={i}>{item}</ListItem>
        ))}
      </List>
    </div>
  );
};

SnapshotPresenterArraySymbol.propTypes = {
  className: PropTypes.string,
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
};

SnapshotPresenterArraySymbol.defaultProps = {
  className: '',
};

export default SnapshotPresenterArraySymbol;
