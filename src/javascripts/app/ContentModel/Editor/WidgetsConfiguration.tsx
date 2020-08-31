import React from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  resetWidgetConfiguration,
  removeItem,
  changeItemPosition,
  addItem,
  openWidgetConfiguration,
} from 'app/ContentModel/Editor/WidgetsConfiguration/WidgetsConfigurationReducer';
import { Heading, Paragraph } from '@contentful/forma-36-react-components';
import CustomConfiguration from './WidgetsConfiguration/CustomConfiguration';
import AvailableWidgets from './WidgetsConfiguration/AvailableWidgets';
import { isSameWidget } from './WidgetsConfiguration/utils';
import {
  ConfigurationItem,
  ConfigurableConfigurationItem,
} from './WidgetsConfiguration/interfaces';

const styles = {
  container: css({
    display: 'flex',
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingM,
  }),
  mainColumn: css({
    minWidth: '384px',
    width: '384px',
    backgroundColor: tokens.colorWhite,
    minHeight: '500px',
    paddingLeft: tokens.spacingL,
  }),
  additionalColumn: css({
    minWidth: '384px',
    width: '384px',
    minHeight: '500px',
    paddingRight: tokens.spacingL,
  }),
  heading: css({
    marginBottom: tokens.spacingS,
  }),
  description: css({
    marginBottom: tokens.spacingL,
  }),
  radioButtonField: css({
    marginLeft: tokens.spacing3Xl,
  }),
  note: css({
    marginBottom: tokens.spacingXl,
  }),
};

interface WidgetsConfigurationProps {
  state: {
    availableItems: ConfigurationItem[];
    configurableWidget: ConfigurableConfigurationItem;
    items: ConfigurationItem[];
  };
  dispatch: Function;
  defaultAvailableItems: ConfigurationItem[];
  configuration: {
    location: string;
    description: string;
    inAppHelpMedium: string; // used for the in app help in `AvailableWidgets.tsx`
  };
}

const WidgetsConfiguration: React.FC<WidgetsConfigurationProps> = ({
  state,
  dispatch,
  defaultAvailableItems,
  configuration,
}) => {
  const unusedAvailableItems = defaultAvailableItems
    .concat(state.availableItems)
    .filter((item) => !state.items.find((selectedItem) => isSameWidget(item, selectedItem)));

  return (
    <>
      <Heading className={styles.heading}>{configuration.location} configuration</Heading>
      <Paragraph className={styles.description}>{configuration.description}</Paragraph>
      <div className={styles.container}>
        <div className={styles.additionalColumn} data-test-id="available-sidebar-items">
          <AvailableWidgets
            location={configuration.location}
            inAppHelpMedium={configuration.inAppHelpMedium}
            items={unusedAvailableItems}
            onAddItem={(item: ConfigurationItem) => {
              dispatch(addItem(item));
            }}
          />
        </div>
        <div
          className={styles.mainColumn}
          data-test-id={`custom-${configuration.location.toLowerCase()}-column`}>
          <CustomConfiguration
            title={configuration.location}
            onResetClick={() => dispatch(resetWidgetConfiguration(defaultAvailableItems))}
            items={state.items}
            onRemoveItem={(widget: ConfigurationItem) => {
              dispatch(removeItem(widget));
            }}
            onChangePosition={(sourceIndex: number, destinationIndex: number) => {
              dispatch(changeItemPosition(sourceIndex, destinationIndex));
            }}
            onConfigureItem={(widget: ConfigurationItem) => {
              dispatch(openWidgetConfiguration(widget));
            }}
            showResetButton={!isEqual(state.items, defaultAvailableItems)}
          />
        </div>
      </div>
    </>
  );
};

WidgetsConfiguration.propTypes = {
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  defaultAvailableItems: PropTypes.array.isRequired,
};

export default WidgetsConfiguration;
