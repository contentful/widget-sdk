import React from 'react';
import PropTypes from 'prop-types';
import { ReferenceCard, IconButton } from '@contentful/forma-36-react-components';
import Thumbnail from './Thumbnail.es6';

class WrappedReferenceCard extends React.Component {
  static propTypes = {
    contentTypeName: PropTypes.string,
    entityDescription: PropTypes.string,
    entityFile: PropTypes.object,
    entityTitle: PropTypes.string,
    entityStatus: PropTypes.string,
    isLoading: PropTypes.bool,
    extraClassNames: PropTypes.string,
    disabled: PropTypes.bool,
    selected: PropTypes.bool,
    onEdit: PropTypes.func,
    onRemove: PropTypes.func,
    readOnly: PropTypes.bool
  };

  static defaultProps = {
    extraClassNames: ''
  };

  renderEditButton() {
    return (
      <IconButton
        iconProps={{ icon: 'Edit' }}
        label="Edit referenced entry"
        onClick={event => {
          event.stopPropagation();
          this.props.onEdit();
        }}
        buttonType="muted"
        testId="edit"
      />
    );
  }

  renderDeleteButton() {
    return (
      <IconButton
        iconProps={{ icon: 'Close' }}
        label="Remove reference to entry"
        onClick={event => {
          event.stopPropagation();
          this.props.onRemove();
        }}
        buttonType="muted"
        disabled={this.props.disabled}
        testId="delete"
      />
    );
  }

  renderActions = () => {
    return !this.props.readOnly ? (
      <React.Fragment>
        {this.props.onEdit && this.renderEditButton()}
        {this.props.onRemove && this.renderDeleteButton()}
      </React.Fragment>
    ) : null;
  };

  render() {
    const {
      contentTypeName,
      entityDescription,
      entityFile,
      entityTitle,
      extraClassNames,
      selected,
      entityStatus,
      isLoading
    } = this.props;

    return (
      <ReferenceCard
        title={entityTitle || 'Untitled'}
        contentType={contentTypeName}
        extraClassNames={extraClassNames}
        description={entityDescription}
        selected={selected}
        status={entityStatus}
        thumbnailElement={entityFile && <Thumbnail thumbnail={entityFile} />}
        loading={isLoading}
        actionElements={this.renderActions()}
      />
    );
  }
}

export default WrappedReferenceCard;
