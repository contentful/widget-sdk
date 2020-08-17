import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  selectSidebarType,
  removeItemFromSidebar,
  changeItemPosition,
  addItemToSidebar,
  openWidgetConfiguration,
} from 'app/EntrySidebar/Configuration/SidebarConfigurationReducer';
import { SidebarType } from 'app/EntrySidebar/Configuration/constants';
import { Heading, Paragraph, Note } from '@contentful/forma-36-react-components';
import FeedbackButton from 'app/common/FeedbackButton';
import CustomSidebar from './WidgetsConfiguration/CustomSidebar';
import AvailableWidgets from './WidgetsConfiguration/AvailableWidgets';

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
    // padding: `${tokens.spacingM} ${tokens.spacingL} ${tokens.spacingL}`,
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
  state: any;
  dispatch: Function;
  defaultAvailableItems: any;
  configuration: {
    location: string;
    description: string;
  };
}

const WidgetsConfiguration: React.FC<WidgetsConfigurationProps> = ({
  state,
  dispatch,
  defaultAvailableItems,
  configuration,
}) => {
  console.log(defaultAvailableItems);
  console.log(state);
  return (
    <React.Fragment>
      <Heading className={styles.heading}>{configuration.location} configuration</Heading>
      <Paragraph className={styles.description}>{configuration.description}</Paragraph>
      <div className={styles.container}>
        <React.Fragment>
          <div className={styles.additionalColumn} data-test-id="available-sidebar-items">
            <AvailableWidgets
              items={state.availableItems}
              onAddItem={(item: any) => {
                dispatch(addItemToSidebar(item));
              }}
            />
          </div>
          <div className={styles.mainColumn} data-test-id="custom-sidebar-column">
            <CustomSidebar
              onResetClick={() => dispatch(selectSidebarType(SidebarType.default))}
              items={
                state.sidebarType === SidebarType.default ? defaultAvailableItems : state.items
              }
              onRemoveItem={(widget: any) => {
                if (state.sidebarType === SidebarType.default) {
                  dispatch(selectSidebarType(SidebarType.custom));
                }
                dispatch(removeItemFromSidebar(widget));
              }}
              onChangePosition={(sourceIndex: number, destinationIndex: number) => {
                if (state.sidebarType === SidebarType.default) {
                  dispatch(selectSidebarType(SidebarType.custom));
                }
                dispatch(changeItemPosition(sourceIndex, destinationIndex));
              }}
              onConfigureItem={(widget: any) => {
                if (state.sidebarType === SidebarType.default) {
                  dispatch(selectSidebarType(SidebarType.custom));
                }
                dispatch(openWidgetConfiguration(widget));
              }}
            />
          </div>
        </React.Fragment>
      </div>
      <Note className={styles.note}>
        <FeedbackButton
          target="extensibility"
          about="Sidebar configuration"
          label="Send feedback"
        />{' '}
        and let us know how we can improve the sidebar configuration.
      </Note>
    </React.Fragment>
  );
};

WidgetsConfiguration.propTypes = {
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  defaultAvailableItems: PropTypes.array.isRequired,
};

export default WidgetsConfiguration;
