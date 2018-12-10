import React from 'react';
import { Tooltip, TextLink, Tag } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import { truncate } from 'utils/StringUtils.es6';
import { INLINES } from '@contentful/rich-text-types';
import RequestStatus from '../shared/RequestStatus.es6';
import FetchEntity from '../shared/FetchEntity/index.es6';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import { detect as detectBrowser } from 'detect-browser';

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
      <Tooltip content={tooltip} extraClassNames="rich-text__hyperlink-container" maxWidth="auto">
        {hasRealHyperlinkInSlateSupport() ? (
          <TextLink
            href={href} // Allows user to open uri link in new tab.
            rel="noopener noreferrer"
            title={title}
            extraClassNames="rich-text__hyperlink">
            {children}
            {/*<Icon icon={icon} extraClassNames="rich-text__hyperlink-icon" />*/}
          </TextLink>
        ) : (
          <span className="rich-text__hyperlink rich-text__hyperlink--ie-fallback">{children}</span>
        )}
      </Tooltip>
    );
  }

  renderEntityTooltipContent = (contentTypeName, title, entityStatus) => {
    const statusTagTypeMapping = {
      published: 'positive',
      draft: 'warning',
      archived: 'negative',
      changed: 'primary'
    };
    return (
      <div className="rich-text__entity-tooltip-content">
        <span className="rich-text__entity-tooltip-content__content-type">{contentTypeName}</span>
        <span className="rich-text__entity-tooltip-content__title">{title}</span>
        <Tag tagType={statusTagTypeMapping[entityStatus]}>{entityStatus.toUpperCase()}</Tag>
      </div>
    );
  };

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
                tooltip = this.renderEntityTooltipContent(contentTypeName, title, entityStatus);
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

function hasRealHyperlinkInSlateSupport() {
  // The <a/> element as an inline node causes buggy behavior in IE11/Edge.
  return !['ie', 'edge'].includes(detectBrowser().name);
}
