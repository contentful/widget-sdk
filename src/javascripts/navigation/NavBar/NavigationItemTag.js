import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { NewTag } from 'components/shared/NewTag';

const styles = {
  tag: css({
    position: 'absolute',
    top: tokens.spacingXs,
    right: `${tokens.spacing2Xs}`,
  }),
};

export default function NavigationItemTag({ label }) {
  return <NewTag label={label} className={styles.tag} />;
}

NavigationItemTag.propTypes = {
  label: PropTypes.string.isRequired,
};
