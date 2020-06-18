import React from 'react';
import PropTypes from 'prop-types';
import { Subheading, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import AvailableWidget from './AvailableWidget';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const styles = {
  availableItemsTitle: css({
    marginBottom: tokens.spacingM,
  }),
  availableItemsList: css({
    marginBottom: tokens.spacingL,
  }),
  uiExtensionInfo: css({
    marginBottom: tokens.spacingM,
  }),
  uiExtensionInfoTitle: css({
    marginBottom: tokens.spacingS,
  }),
};

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'use-customer-sidebar-available-items',
  campaign: 'in-app-help',
});

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
            onClick={() => {
              props.onAddItem(item);
            }}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className={styles.uiExtensionInfo}>
          <Paragraph className={styles.uiExtensionInfoTitle}>
            Contentful apps extend and expand the capabilities of the Contentful web app.
          </Paragraph>
          <TextLink
            icon="ExternalLink"
            href="https://www.contentful.com/marketplace/?utm_campaign=in-app-help"
            target="_blank"
            rel="noopener noreferrer">
            Browse all apps
          </TextLink>
        </div>
      )}
      <Paragraph>
        Learn{' '}
        <TextLink
          href={withInAppHelpUtmParams(
            'https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/?utm_campaign=in-app-help'
          )}
          target="_blank"
          rel="noopener noreferrer">
          how to build your first app
        </TextLink>
      </Paragraph>
    </div>
  );
}

AvailableItems.propTypes = {
  items: PropTypes.array.isRequired,
  onAddItem: PropTypes.func.isRequired,
};
