import React, { useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Paragraph,
  FieldGroup,
  RadioButtonField
} from '@contentful/forma-36-react-components';
import DefaultSidebar from './components/DefaultSidebar.es6';
import CustomSidebar from './components/CustomSidebar.es6';
import AvailableItems from './components/AvailableItems.es6';
import { SidebarType } from './constants.es6';
import {
  reducer,
  initialState,
  selectSidebarType,
  removeItemFromSidebar,
  changeItemPosition,
  addItemToSidebar
} from './SidebarConfigurationState.es6';

function SidebarConfiguration(props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    props.onUpdateConfiguration(state);
  }, [state]);

  return (
    <div className="sidebar-configuration">
      <Heading extraClassNames="f36-margin-bottom--s">Sidebar configuration</Heading>
      <Paragraph extraClassNames="f36-margin-bottom--l">
        Configure the sidebar for this content type.
      </Paragraph>
      <FieldGroup>
        <RadioButtonField
          labelText="Use the default sidebar"
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
          labelText="Use a custom sidebar"
          name="sidebarType"
          id={SidebarType.custom}
          checked={state.sidebarType === SidebarType.custom}
          onChange={() => {
            dispatch(selectSidebarType(SidebarType.custom));
          }}
          value={SidebarType.custom}
        />
      </FieldGroup>
      <div className="sidebar-configuration__container f36-margin-top--l">
        {state.sidebarType === SidebarType.default && (
          <div className="sidebar-configuration__main-column">
            <DefaultSidebar />
          </div>
        )}
        {state.sidebarType === SidebarType.custom && (
          <React.Fragment>
            <div className="sidebar-configuration__main-column">
              <CustomSidebar
                items={state.items}
                onRemoveItem={item => {
                  dispatch(removeItemFromSidebar(item));
                }}
                onChangePosition={(sourceIndex, destinationIndex) => {
                  dispatch(changeItemPosition(sourceIndex, destinationIndex));
                }}
              />
            </div>
            <div className="sidebar-configuration__additional-column">
              <AvailableItems
                items={state.availableItems}
                onAddItem={item => {
                  dispatch(addItemToSidebar(item));
                }}
              />
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

SidebarConfiguration.propTypes = {
  sidebar: PropTypes.array,
  onUpdateConfiguration: PropTypes.func.isRequired
};

export default SidebarConfiguration;
