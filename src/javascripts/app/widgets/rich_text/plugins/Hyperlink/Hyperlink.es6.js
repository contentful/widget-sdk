import React from 'react';
import { Tooltip, TextLink } from '@contentful/ui-component-library';
import PropTypes from 'prop-types';
import { truncate } from 'utils/StringUtils.es6';
import { INLINES } from '@contentful/rich-text-types';
import RequestStatus from '../shared/RequestStatus.es6';
import FetchEntity from '../shared/FetchEntity/index.es6';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';

const { HYPERLINK, ENTRY_HYPERLINK, ASSET_HYPERLINK } = INLINES;

const ICON_MAP = {
  [HYPERLINK]: 'ExternalLink',
  [ENTRY_HYPERLINK]: 'Entry',
  [ASSET_HYPERLINK]: 'Asset'
};

const HyperlinkTooltipContainer = ({ children, ...otherProps }) => (
  <span className="rich-text__hyperlink-container" {...otherProps}>
    {children}
  </span>
);

export default class Hyperlink extends React.Component {
  static propTypes = {
    attributes: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired,
    children: PropTypes.node,
    editor: PropTypes.object,
    createHyperlinkDialog: PropTypes.func
  };

  render() {
    const { node } = this.props;
    const uri = node.data.get('uri');
    const target = node.data.get('target');
    // TODO: Use icon once we implement nicer cursor interaction with link.
    const _icon = ICON_MAP[node.type];

    return (
      <span {...this.props.attributes} onClick={this.props.onClick}>
        {target ? this.renderEntityLink(target) : this.renderLink({ tooltip: uri })}
      </span>
      // TODO: Add contentEditable={false} to tooltip to fix text cursor bug
    );
  }

  renderLink({ tooltip }) {
    const { children, node } = this.props;
    const title = node.data.get('title');
    const uri = node.data.get('uri');
    const href = isUrl(uri) ? uri : 'javascript:void(0)';

    return (
      <Tooltip content={tooltip} containerElement={HyperlinkTooltipContainer}>
        <TextLink
          href={href} // Allows user to open link in new tab.
          title={title}
          extraClassNames="rich-text__hyperlink">
          {children}
          {/*<Icon icon={icon} extraClassNames="rich-text__hyperlink-icon" />*/}
        </TextLink>
      </Tooltip>
    );
  }

  renderEntityLink(target) {
    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <FetchEntity
            widgetAPI={widgetAPI}
            entityId={target.sys.id}
            entityType={target.sys.linkType}
            localeCode={widgetAPI.field.locale}
            render={({ requestStatus, entityTitle, entityStatus, contentTypeName = 'Asset' }) => {
              const title = truncate(entityTitle, 60) || 'Untitled';
              let tooltip = '';
              if (requestStatus === RequestStatus.Error) {
                tooltip = `${target.sys.linkType} missing or inaccessible`;
              } else if (requestStatus === RequestStatus.Success) {
                tooltip = `${contentTypeName}: ${title} (${entityStatus.toUpperCase()})`;
              } else if (requestStatus === RequestStatus.Pending) {
                tooltip = `Loading ${target.sys.linkType.toLowerCase()}...`;
              }
              return this.renderLink({ tooltip });
            }}
          />
        )}
      </WidgetAPIContext.Consumer>
    );
  }
}

function isUrl(string) {
  return /^(?:[a-z]+:)?\/\//i.test(string) || /^mailto:/i.test(string);
}
