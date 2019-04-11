import React from 'react';
import PropTypes from 'prop-types';
import { EntryCard, DropdownList, DropdownListItem } from '@contentful/forma-36-react-components';
import Thumbnail from './Thumbnail.es6';

class WrappedReferenceCard extends React.Component {
  static propTypes = {
    contentTypeName: PropTypes.string,
    entityDescription: PropTypes.string,
    entityFile: PropTypes.object,
    entityTitle: PropTypes.string,
    entityStatus: PropTypes.string,
    isLoading: PropTypes.bool,
    className: PropTypes.string,
    size: PropTypes.string,
    disabled: PropTypes.bool,
    selected: PropTypes.bool,
    onEdit: PropTypes.func,
    onRemove: PropTypes.func,
    onClick: PropTypes.func,
    readOnly: PropTypes.bool
  };

  static defaultProps = {
    className: ''
  };

  renderEditAction() {
    return (
      <DropdownListItem
        onClick={() => {
          this.props.onEdit();
        }}
        testId="edit">
        Edit
      </DropdownListItem>
    );
  }

  renderDeleteAction() {
    return (
      <DropdownListItem
        onClick={() => {
          this.props.onRemove();
        }}
        disabled={this.props.disabled}
        testId="delete">
        Remove
      </DropdownListItem>
    );
  }

  renderActions = () => {
    return !this.props.readOnly ? (
      <DropdownList>
        {this.props.onEdit && this.renderEditAction()}
        {this.props.onRemove && this.renderDeleteAction()}
      </DropdownList>
    ) : null;
  };

  render() {
    const {
      contentTypeName,
      entityDescription,
      entityFile,
      entityTitle,
      className,
      size,
      selected,
      entityStatus,
      isLoading,
      onClick
    } = this.props;

    return (
      <EntryCard
        title={entityTitle || 'Untitled'}
        contentType={contentTypeName}
        className={className}
        description={entityDescription}
        size={size}
        selected={selected}
        status={entityStatus}
        thumbnailElement={entityFile && <Thumbnail thumbnail={entityFile} />}
        loading={isLoading}
        dropdownListElements={this.renderActions()}
        onClick={onClick}
      />
    );
  }
}

export default WrappedReferenceCard;
