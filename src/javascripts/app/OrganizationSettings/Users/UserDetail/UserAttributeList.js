import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { List, ListItem } from '@contentful/forma-36-react-components';

const styles = {
  list: css({
    borderTop: `1px solid ${tokens.colorElementLight}`,
    paddingTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    color: tokens.colorTextMid
  }),
  item: css({
    display: 'flex',
    alignItems: 'center'
  }),
  label: css({
    marginRight: tokens.spacingS
  })
};

export default function UserAttributeList({ attributes }) {
  return (
    <List className={styles.list}>
      {attributes.map(({ label, value }) => (
        <ListItem key={label} className={styles.item}>
          <strong className={styles.label}>{label}</strong>
          {value}
        </ListItem>
      ))}
    </List>
  );
}

UserAttributeList.propTypes = {
  attributes: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired
    })
  )
};
