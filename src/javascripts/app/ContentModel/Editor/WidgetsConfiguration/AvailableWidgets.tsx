import React from 'react';
import { Subheading, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import AvailableWidget from './AvailableWidget';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { ConfigurationItem } from './interfaces';

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

const withInAppHelpUtmParams = (medium: string) =>
  buildUrlWithUtmParams({
    source: 'webapp',
    medium,
    campaign: 'in-app-help',
  });

interface AvailableWidgetsProps {
  items: ConfigurationItem[];
  onAddItem: (item: ConfigurationItem) => void;
  location: string;
  inAppHelpMedium: string;
}

export default function AvailableItems(props: AvailableWidgetsProps) {
  const { items, location, onAddItem, inAppHelpMedium } = props;

  return (
    <div>
      <Subheading className={styles.availableItemsTitle}>Available items</Subheading>
      <div className={styles.availableItemsList}>
        {items.map((item) => (
          <AvailableWidget
            location={location}
            key={`${item.widgetNamespace},${item.widgetId}`}
            name={item.name}
            widgetNamespace={item.widgetNamespace}
            availabilityStatus={item.availabilityStatus}
            onClick={() => {
              onAddItem(item);
            }}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className={styles.uiExtensionInfo}>
          <Paragraph className={styles.uiExtensionInfoTitle}>
            Customize or extend the {location.toLowerCase()} by installing apps from the{' '}
            <TextLink
              href={withInAppHelpUtmParams(inAppHelpMedium)(
                'https://www.contentful.com/marketplace/'
              )}
              target="_blank"
              rel="noopener noreferrer">
              Marketplace
            </TextLink>{' '}
            or{' '}
            <TextLink
              href={withInAppHelpUtmParams(inAppHelpMedium)(
                'https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/'
              )}
              target="_blank"
              rel="noopener noreferrer">
              building your own app
            </TextLink>
          </Paragraph>
        </div>
      )}
    </div>
  );
}
