import * as React from 'react';
import { NodePropTypes } from './PropTypes.es6';

export default function(Tag, tagProps = {}) {
  const CommonNode = ({ attributes, children, node }) => {
    return (
      <Tag data-test-id={node.type} {...tagProps} {...attributes}>
        {children}
      </Tag>
    );
  };

  CommonNode.displayName = `${Tag}-node`;
  CommonNode.propTypes = NodePropTypes;

  return CommonNode;
}
