import React from 'react';
import { Icon, Tooltip, TextLink } from '@contentful/ui-component-library';
import PropTypes from 'prop-types';
import { INLINES } from '@contentful/structured-text-types';

const { HYPERLINK, ENTRY_HYPERLINK, ASSET_HYPERLINK } = INLINES;

const ICON_MAP = {
  [HYPERLINK]: 'ExternalLink',
  [ENTRY_HYPERLINK]: 'Entry',
  [ASSET_HYPERLINK]: 'Asset'
};

export default class Hyperlink extends React.Component {
  static propTypes = {
    attributes: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired,
    children: PropTypes.node,
    onClick: PropTypes.func
  };

  render() {
    const { children, node } = this.props;
    const uri = node.data.get('uri');
    const title = node.data.get('title');
    const icon = ICON_MAP[node.type];

    return (
      <span>
        <TextLink
          href="javascript:void(0)"
          data-tip={uri}
          title={title}
          extraClassNames="structured-text__hyperlink">
          {children}
          <Icon icon={icon} extraClassNames="structured-text__hyperlink-icon" />
        </TextLink>
        <Tooltip show={true} />
      </span>
      // TODO: Add contentEditable={false} to tooltip to fix text cursor bug
    );
  }
}
