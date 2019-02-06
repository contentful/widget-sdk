import React from 'react';
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
import { connect } from 'react-redux';
import {
  selectSidebarType,
  removeItemFromSidebar,
  changeItemPosition,
  addItemToSidebar
} from './redux/reducer.es6';

const mapStateToProps = state => ({
  sidebarType: state.sidebar.sidebarType,
  items: state.sidebar.items,
  availableItems: state.sidebar.availableItems
});

const mapDispatchToProps = {
  selectSidebarType,
  removeItemFromSidebar,
  changeItemPosition,
  addItemToSidebar
};

function SidebarConfiguration(props) {
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
          checked={props.sidebarType === SidebarType.default}
          onChange={() => {
            props.selectSidebarType(SidebarType.default);
          }}
          value={SidebarType.default}
        />
        <div className="f36-margin-top--m" />
        <RadioButtonField
          labelText="Use a custom sidebar"
          name="sidebarType"
          id={SidebarType.custom}
          checked={props.sidebarType === SidebarType.custom}
          onChange={() => {
            props.selectSidebarType(SidebarType.custom);
          }}
          value={SidebarType.custom}
        />
      </FieldGroup>
      <div className="sidebar-configuration__container f36-margin-top--l">
        {props.sidebarType === SidebarType.default && (
          <div className="sidebar-configuration__main-column">
            <DefaultSidebar />
          </div>
        )}
        {props.sidebarType === SidebarType.custom && (
          <React.Fragment>
            <div className="sidebar-configuration__main-column">
              <CustomSidebar
                items={props.items}
                onRemoveItem={item => props.removeItemFromSidebar(item.id)}
                onChangePosition={(sourceIndex, destinationIndex) =>
                  props.changeItemPosition(sourceIndex, destinationIndex)
                }
              />
            </div>
            <div className="sidebar-configuration__additional-column">
              <AvailableItems
                items={props.availableItems}
                onAddItem={item => props.addItemToSidebar(item)}
              />
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

SidebarConfiguration.propTypes = {
  items: PropTypes.array.isRequired,
  availableItems: PropTypes.array.isRequired,
  sidebarType: PropTypes.string.isRequired,
  selectSidebarType: PropTypes.func.isRequired,
  removeItemFromSidebar: PropTypes.func.isRequired,
  changeItemPosition: PropTypes.func.isRequired,
  addItemToSidebar: PropTypes.func.isRequired
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SidebarConfiguration);
