import React from 'react';
import PropTypes from 'prop-types';
import { Subheading, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import AvailableWidget from './AvailableWidget.es6';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const styles = {
  availableItemsTitle: css({
    marginBottom: tokens.spacingM
  }),
  availableItemsList: css({
    marginBottom: tokens.spacingL
  }),
  uiExtensionInfo: css({
    marginBottom: tokens.spacingM
  }),
  uiExtensionInfoTitle: css({
    marginBottom: tokens.spacingS
  })
};

export default function AvailableItems(props) {
  const { items } = props;

  return (
    <div>
      <Subheading className={styles.availableItemsTitle}>Available items</Subheading>
      <div className={styles.availableItemsList}>
        {items.map((item, index) => (
          <AvailableWidget
            key={`${item.widgetNamespace},${item.widgetId}`}
            name={item.name}
            index={index}
            widgetNamespace={item.widgetNamespace}
            availabilityStatus={item.availabilityStatus}
            isApp={item.isApp}
            onClick={() => {
              props.onAddItem(item);
            }}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className={styles.uiExtensionInfo}>
          <Paragraph className={styles.uiExtensionInfoTitle}>
            UI Extensions can enrich how content is created, edited, or shared with other services.
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
