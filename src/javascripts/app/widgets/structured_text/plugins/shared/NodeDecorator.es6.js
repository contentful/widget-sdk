import * as React from 'react';
import { NodePropTypes } from './PropTypes';

export default function (Tag) {
  const CommonNode = ({ attributes, children }) => {
    return <Tag {...attributes}>{children}</Tag>;
  };

  CommonNode.displayName = `${Tag}-node`;
  CommonNode.propTypes = NodePropTypes;

  return CommonNode;
}
