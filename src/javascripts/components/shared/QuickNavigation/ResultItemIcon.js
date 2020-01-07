import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ContentTypesIcon from 'svg/nav-ct.svg';
import EntriesIcon from 'svg/nav-entries.svg';
import MediaIcon from 'svg/nav-media.svg';

const iconStyles = css({
  verticalAlign: 'middle',
  padding: tokens.spacingXs,
  '& svg': {
    fill: tokens.colorGreenBase,
    height: '14px'
  }
});

const iconComponentsMap = {
  content_types: ContentTypesIcon,
  entries: EntriesIcon,
  assets: MediaIcon
};

const ResultItemIcon = ({ type }) => {
  const Icon = iconComponentsMap[type];
  return Icon ? (
    <span className={iconStyles}>
      <Icon />
    </span>
  ) : null;
};

export default ResultItemIcon;

ResultItemIcon.propTypes = {
  type: PropTypes.string.isRequired
};
