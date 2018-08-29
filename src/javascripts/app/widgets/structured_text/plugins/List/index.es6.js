import React from 'react';
import { BLOCKS } from '@contentful/structured-text-types';
import ToolbarIcon from '../shared/ToolbarIcon';

import commonNode from '../shared/NodeDecorator';
import listToggleDecorator from './ToolbarDecorator';

export const ListPlugin = () => {
  return {
    renderNode: props => {
      if (props.node.type === BLOCKS.UL_LIST) {
        return commonNode('ul')(props);
      } else if (props.node.type === BLOCKS.OL_LIST) {
        return commonNode('ol')(props);
      } else if (props.node.type === BLOCKS.LIST_ITEM) {
        return commonNode('li')(props);
      }
    }
  };
};

export const UnorderedList = listToggleDecorator({
  type: BLOCKS.UL_LIST,
  title: 'UL',
  icon: 'ListBulleted'
})((props) => <ToolbarIcon {...props} />);

export const OrderedList = listToggleDecorator({
  type: BLOCKS.OL_LIST,
  title: 'OL',
  icon: 'ListNumbered'
})((props) => <ToolbarIcon {...props} />);
