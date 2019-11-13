import React from 'react';
import PropTypes from 'prop-types';
import arraySwap from 'utils/arraySwap';

import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';

import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';

import {
  Icon,
  Dropdown,
  DropdownListItem,
  DropdownList,
  IconButton,
  Tooltip
} from '@contentful/forma-36-react-components';

const styles = {
  root: css({
    display: 'inline-block',
    marginLeft: tokens.spacingXs
  }),
  tooltip: css({
    display: 'flex'
  }),
  listItem: css({
    'button > span': {
      paddingLeft: 0,
      display: 'flex',
      alignItems: 'center'
    }
  }),
  dragHandle: css({
    svg: {
      width: 30,
      verticalAlign: 'middle'
    }
  }),
  sortableHelper: css({
    zIndex: 9999
  })
};

const SortableContainer = sortableContainer(({ children }) => <div>{children}</div>);
const SortableItem = sortableElement(({ name, onClick }) => (
  <DropdownListItem onClick={onClick} className={styles.listItem}>
    <SortHandle />
    <span>{name}</span>
  </DropdownListItem>
));
const SortHandle = sortableHandle(() => (
  <span className={styles.dragHandle}>
    <Icon icon="Drag" color="muted" />
  </span>
));

export default class ViewCustomizer extends React.Component {
  static propTypes = {
    displayedFields: PropTypes.array,
    hiddenFields: PropTypes.array,
    addDisplayField: PropTypes.func.isRequired,
    removeDisplayField: PropTypes.func.isRequired,
    toggleContentType: PropTypes.func.isRequired,
    updateFieldOrder: PropTypes.func.isRequired,
    isContentTypeHidden: PropTypes.bool
  };
  static defaultProps = {
    displayedFields: [],
    hiddenFields: []
  };
  state = {
    isOpen: false,
    optimisticFields: null
  };

  componentDidUpdate(prevProps) {
    if (this.props.displayedFields !== prevProps.displayedFields) {
      this.setState({ optimisticFields: null });
    }
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    const reorderedFields = arraySwap(this.props.displayedFields, oldIndex, newIndex);

    this.setState({ optimisticFields: reorderedFields });
    this.props.updateFieldOrder(reorderedFields);
  };

  render() {
    const fields = this.state.optimisticFields || this.props.displayedFields;
    const hasHiddenFields = this.props.hiddenFields.length > 0 || this.props.isContentTypeHidden;
    return (
      <Dropdown
        className={styles.root}
        isOpen={this.state.isOpen}
        onClose={() => this.setState({ isOpen: false })}
        position="bottom-right"
        toggleElement={
          <Tooltip
            content="Select visible columns"
            place="left"
            targetWrapperClassName={styles.tooltip}>
            <IconButton
              buttonType="muted"
              iconProps={{ icon: 'Settings' }}
              label="Select visible columns"
              onClick={() => this.setState({ isOpen: !this.state.isOpen })}
            />
          </Tooltip>
        }>
        <DropdownList maxHeight={'50vh'}>
          <DropdownListItem isTitle>Displayed Columns</DropdownListItem>
          <DropdownListItem isDisabled>Name</DropdownListItem>
          {!this.props.isContentTypeHidden && (
            <DropdownListItem onClick={() => this.props.toggleContentType()}>
              Content Type
            </DropdownListItem>
          )}
          <SortableContainer
            useDragHandle
            axis="y"
            onSortEnd={this.onSortEnd}
            helperClass={styles.sortableHelper}>
            {fields.map((fieldInfo, index) => (
              <SortableItem
                key={fieldInfo.id}
                name={fieldInfo.name}
                index={index}
                onClick={() => {
                  this.props.removeDisplayField(fieldInfo);
                }}
              />
            ))}
          </SortableContainer>
          <DropdownListItem isDisabled>Status</DropdownListItem>
          {hasHiddenFields && (
            <React.Fragment>
              <DropdownListItem isTitle>Available columns</DropdownListItem>
              {this.props.isContentTypeHidden && (
                <DropdownListItem onClick={() => this.props.toggleContentType()}>
                  Content Type
                </DropdownListItem>
              )}
              {this.props.hiddenFields.map(
                fieldInfo =>
                  fieldInfo.type !== 'Object' &&
                  !fieldInfo.disabled && (
                    <DropdownListItem
                      key={fieldInfo.id}
                      onClick={() => {
                        this.props.addDisplayField(fieldInfo);
                      }}>
                      {fieldInfo.name}
                    </DropdownListItem>
                  )
              )}
            </React.Fragment>
          )}
        </DropdownList>
      </Dropdown>
    );
  }
}
