import { Tag } from '@contentful/forma-36-react-components';
import React from 'react';
import classNames from 'classnames';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';

const styles = {
  tag: css({
    background: tokens.colorBlueDark,
    color: tokens.colorWhite,
    padding: '3px 5px',
    fontSize: '10px',
    lineHeight: '10px',
    borderRadius: '3px',
    textTransform: 'uppercase',
    letterSpacing: '0.05rem',
  }),
};

const NewTag = ({ label, key, className }) => {
  return (
    <Tag key={key} className={classNames(styles.tag, className)}>
      {label || 'new'}
    </Tag>
  );
};

NewTag.propTypes = {
  label: PropTypes.string,
  key: PropTypes.string,
  className: PropTypes.string,
};

export { NewTag };
