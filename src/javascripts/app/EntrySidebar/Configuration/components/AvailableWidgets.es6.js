import React from 'react';
import PropTypes from 'prop-types';
import {
  Subheading,
  SectionHeading,
  Paragraph,
  TextLink
} from '@contentful/forma-36-react-components';
import AvailableWidget from './AvailableWidget.es6';
import { NAMESPACE_EXTENSION, NAMESPACE_SIDEBAR_BUILTIN } from 'widgets/WidgetNamespaces.es6';

export default function AvailableItems(props) {
  const builtin = props.items.filter(item => item.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN);
  const extensions = props.items.filter(item => item.widgetNamespace === NAMESPACE_EXTENSION);
  return (
    <div>
      <Subheading className="f36-margin-bottom--m">Available items</Subheading>
      {builtin.length > 0 && (
        <React.Fragment>
          <SectionHeading className="f36-margin-bottom--xs">Built-in</SectionHeading>
          <div className="f36-margin-bottom--l">
            {builtin.map((item, index) => (
              <AvailableWidget
                key={`${item.widgetNamespace},${item.widgetId}`}
                name={item.name}
                index={index}
                widgetNamespace={item.widgetNamespace}
                availabilityStatus={item.availabilityStatus}
                onClick={() => {
                  props.onAddItem(item);
                }}
              />
            ))}
          </div>
        </React.Fragment>
      )}
      <SectionHeading className="f36-margin-bottom--xs">UI Extensions</SectionHeading>
      {extensions.length > 0 && (
        <div className="f36-margin-bottom--l">
          {extensions.map((item, index) => (
            <AvailableWidget
              key={`${item.widgetNamespace},${item.widgetId}`}
              name={item.name}
              index={index}
              widgetNamespace={item.widgetNamespace}
              onClick={() => {
                props.onAddItem(item);
              }}
            />
          ))}
        </div>
      )}
      {extensions.length === 0 && (
        <div className="f36-margin-bottom--m">
          <Paragraph className="f36-margin-bottom--s">
            UI Extensions can enrich how content is created, editor or shared with other services.
          </Paragraph>
          <TextLink
            icon="ExternalLink"
            href="https://www.contentful.com/developers/marketplace"
            target="_blank">
            Add a new UI Extension
          </TextLink>
        </div>
      )}
      <Paragraph>
        Learn more about{' '}
        <TextLink
          href="https://www.contentful.com/developers/docs/extensibility/ui-extensions/"
          target="_blank">
          UI Extensions
        </TextLink>
      </Paragraph>
    </div>
  );
}

AvailableItems.propTypes = {
  items: PropTypes.array.isRequired,
  onAddItem: PropTypes.func.isRequired
};
