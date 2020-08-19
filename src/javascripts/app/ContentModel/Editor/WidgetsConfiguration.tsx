import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  resetWidgetConfiguration,
  removeItemFromSidebar,
  changeItemPosition,
  addItemToSidebar,
  openWidgetConfiguration,
} from 'app/EntrySidebar/Configuration/SidebarConfigurationReducer';
import { Heading, Paragraph } from '@contentful/forma-36-react-components';
import CustomConfiguration from './WidgetsConfiguration/CustomConfiguration';
import AvailableWidgets from './WidgetsConfiguration/AvailableWidgets';
import { ConfigurationItem } from './WidgetsConfiguration/interfaces';

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
    paddingRight: tokens.spacingL,
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
    configurableWidget: any; // what is this?
    items: ConfigurationItem[];
  };
  dispatch: Function;
  defaultAvailableItems: ConfigurationItem[];
  configuration: {
    location: string;
    description: string;
  };
}

const isSameWidget = (widgetOne, widgetTwo) =>
  widgetOne.widgetId === widgetTwo.widgetId &&
  widgetOne.widgetNamespace === widgetTwo.widgetNamespace;

const WidgetsConfiguration: React.FC<WidgetsConfigurationProps> = ({
  state,
  dispatch,
  defaultAvailableItems,
  configuration,
}) => {
  const unusedAvailableItems = state.availableItems.filter(
    (item) => !state.items.find((selectedItem) => isSameWidget(item, selectedItem))
  );

  return (
    <React.Fragment>
      <Heading className={styles.heading}>{configuration.location} configuration</Heading>
      <Paragraph className={styles.description}>{configuration.description}</Paragraph>
      <div className={styles.container}>
        <React.Fragment>
          <div className={styles.additionalColumn} data-test-id="available-sidebar-items">
            <AvailableWidgets
              items={unusedAvailableItems}
              onAddItem={(item: ConfigurationItem) => {
                dispatch(addItemToSidebar(item));
              }}
            />
          </div>
          <div className={styles.mainColumn} data-test-id="custom-sidebar-column">
            <CustomConfiguration
              title={configuration.location}
              onResetClick={() => dispatch(resetWidgetConfiguration(defaultAvailableItems))}
              items={state.items}
              onRemoveItem={(widget: ConfigurationItem) => {
                dispatch(removeItemFromSidebar(widget));
              }}
              onChangePosition={(sourceIndex: number, destinationIndex: number) => {
                dispatch(changeItemPosition(sourceIndex, destinationIndex));
              }}
              onConfigureItem={(widget: ConfigurationItem) => {
                dispatch(openWidgetConfiguration(widget));
              }}
            />
          </div>
        </React.Fragment>
      </div>
    </React.Fragment>
  );
};

WidgetsConfiguration.propTypes = {
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  defaultAvailableItems: PropTypes.array.isRequired,
};

export default WidgetsConfiguration;
