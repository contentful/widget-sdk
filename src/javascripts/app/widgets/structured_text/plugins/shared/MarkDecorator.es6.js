import React from 'react';
import { MarkPropTypes } from './PropTypes';

export default function (Tag) {
  const CommonMark = ({ attributes, children }) => {
    return <Tag {...attributes}>{children}</Tag>;
  };

  CommonMark.displayName = `${Tag}-mark`;
  CommonMark.propTypes = MarkPropTypes;

  return CommonMark;
}
