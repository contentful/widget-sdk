import * as React from 'react';
import { NodePropTypes } from './PropTypes.es6';

export default function(Tag, tagProps = {}) {
  const CommonNode = ({ attributes, children }) => {
    return (
      <Tag {...tagProps} {...attributes}>
        {children}
      </Tag>
    );
  };

  CommonNode.displayName = `${Tag}-node`;
  CommonNode.propTypes = NodePropTypes;

  return CommonNode;
}
