import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Dropdown,
  DropdownList,
  DropdownListItem,
  Button
} from '@contentful/forma-36-react-components';

export default class EntrySidebarWidget extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    testId: PropTypes.string,
    tabs: PropTypes.array,
    children: PropTypes.node
  };

  static defaultProps = {
    testId: 'cf-entity-sidebar'
  };

  state = {
    isOpen: false
  };

  toggleDropdown = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  closeDropdown = () => {
    this.setState({ isOpen: false });
  };

  render() {
    const { testId, title, tabs, children, ...restProps } = this.props;
    return (
      <div data-test-id={testId} {...restProps}>
        <header className="entity-sidebar__header">
          <h2 className="entity-sidebar__heading">{title}</h2>
          {tabs && (
            <Dropdown
              isOpen={this.state.isOpen}
              onClose={this.closeDropdown}
              position="bottom-right"
              extraClassNames=""
              toggleElement={
                <Button buttonType="naked" indicateDropdown onClick={this.toggleDropdown}>
                  Type
                </Button>
              }>
              <DropdownList>
                {tabs.map(tab => (
                  <DropdownListItem
                    key={tab.title}
                    onClick={() => {
                      this.closeDropdown();
                      tab.onClick();
                    }}>
                    {tab.title}
                  </DropdownListItem>
                ))}
              </DropdownList>
            </Dropdown>
          )}
        </header>
        {children}
      </div>
    );
  }
}

// widget
//   heading
//     tabs
//       options
//       onChange(id)
//   content
//     tabs(id)
