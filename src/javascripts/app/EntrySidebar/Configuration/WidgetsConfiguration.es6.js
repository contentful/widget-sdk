import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  selectSidebarType,
  removeItemFromSidebar,
  changeItemPosition,
  addItemToSidebar,
  openWidgetConfiguration
} from './SidebarConfigurationReducer.es6';
import { SidebarType } from './constants.es6';
import {
  Heading,
  Paragraph,
  FieldGroup,
  RadioButtonField,
  Note
} from '@contentful/forma-36-react-components';
import FeedbackButton from 'app/common/FeedbackButton.es6';
import DefaultSidebar from './components/DefaultSidebar.es6';
import CustomSidebar from './components/CustomSidebar.es6';
import AvailableWidgets from './components/AvailableWidgets.es6';

const styles = {
  options: css({
    display: 'flex'
  }),
  container: css({
    display: 'flex',
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingM
  }),
  mainColumn: css({
    minWidth: '400px',
    width: '400px',
    border: `1px solid ${tokens.colorElementMid}`,
    backgroundColor: tokens.colorWhite,
    minHeight: '500px',
    padding: `${tokens.spacingM} ${tokens.spacingL} ${tokens.spacingL}`,
    boxShadow: tokens.boxShadowDefault
  }),
  additionalColumn: css({
    minWidth: '400px',
    width: '400px',
    border: `1px solid ${tokens.colorElementMid}`,
    borderLeft: 'none',
    minHeight: '500px',
    padding: `${tokens.spacingM} ${tokens.spacingL}`,
    boxShadow: tokens.boxShadowDefault
  })
};

export default function WidgetsConfiguration({ state, dispatch, defaultAvailableItems }) {
  return (
    <React.Fragment>
      <Heading className="f36-margin-bottom--s">Sidebar configuration</Heading>
      <Paragraph className="f36-margin-bottom--l">
        Configure the sidebar for this content type.
      </Paragraph>
      <FieldGroup>
        <div className={styles.options}>
          <RadioButtonField
            testId="default-sidebar-option"
            labelText="Use default sidebar"
            helpText="Used for all content types without a custom sidebar"
            name="sidebarType"
            id={SidebarType.default}
            checked={state.sidebarType === SidebarType.default}
            onChange={() => {
              dispatch(selectSidebarType(SidebarType.default));
            }}
            value={SidebarType.default}
          />
          <div className="f36-margin-top--m" />
          <RadioButtonField
            testId="custom-sidebar-option"
            className="f36-margin-left--3xl"
            labelText="Use custom sidebar"
            helpText="Used only for this content type"
            name="sidebarType"
            id={SidebarType.custom}
            checked={state.sidebarType === SidebarType.custom}
            onChange={() => {
              dispatch(selectSidebarType(SidebarType.custom));
            }}
            value={SidebarType.custom}
          />
        </div>
      </FieldGroup>
      <div className={styles.container}>
        {state.sidebarType === SidebarType.default && (
          <div className={styles.mainColumn} data-test-id="default-sidebar-column">
            <DefaultSidebar items={defaultAvailableItems} />
          </div>
        )}
        {state.sidebarType === SidebarType.custom && (
          <React.Fragment>
            <div className={styles.mainColumn} data-test-id="custom-sidebar-column">
              <CustomSidebar
                items={state.items}
                onRemoveItem={widget => {
                  dispatch(removeItemFromSidebar(widget));
                }}
                onChangePosition={(sourceIndex, destinationIndex) => {
                  dispatch(changeItemPosition(sourceIndex, destinationIndex));
                }}
                onConfigureItem={widget => {
                  dispatch(openWidgetConfiguration(widget));
                }}
              />
            </div>
            <div className={styles.additionalColumn} data-test-id="available-sidebar-items">
              <AvailableWidgets
                items={state.availableItems}
                onAddItem={item => {
                  dispatch(addItemToSidebar(item));
                }}
              />
            </div>
          </React.Fragment>
        )}
      </div>
      <Note className="f36-margin-bottom--xl">
        <FeedbackButton
          target="extensibility"
          about="Sidebar configuration"
          label="Send feedback"
        />{' '}
        and let us know how we can improve the sidebar configuration.
      </Note>
    </React.Fragment>
  );
}

WidgetsConfiguration.propTypes = {
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  defaultAvailableItems: PropTypes.array.isRequired
};
