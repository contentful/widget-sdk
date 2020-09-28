import React from 'react';
import PropTypes from 'prop-types';
import { EntryCard } from '@contentful/forma-36-react-components';
import { Thumbnail } from '@contentful/field-editor-file';
import { getExternalImageUrl } from 'utils/thumbnailHelpers';

import { EntryActions, AssetActions } from './CardActions';

/**
 * Wrapper around Forma 36 EntryCard. Can be used with entries but works
 * also with assets (as in the link editor's "Link" appearance style).
 */
export default class WrappedEntityCard extends React.Component {
  static propTypes = {
    entityType: PropTypes.string.isRequired,
    contentTypeName: PropTypes.string,
    entityDescription: PropTypes.string,
    entityFile: PropTypes.object,
    entityTitle: PropTypes.string,
    entityStatus: PropTypes.string,
    href: PropTypes.string,
    isLoading: PropTypes.bool,
    className: PropTypes.string,
    size: PropTypes.string,
    disabled: PropTypes.bool,
    selected: PropTypes.bool,
    onEdit: PropTypes.func,
    onRemove: PropTypes.func,
    onClick: PropTypes.func,
    readOnly: PropTypes.bool,
    cardDragHandleComponent: PropTypes.element,
  };

  static defaultProps = {
    className: '',
  };

  renderActions = () => {
    if (this.props.readOnly) {
      return null;
    }
    const { entityType, disabled: isDisabled, onEdit, onRemove, entityFile } = this.props;
    const actions =
      entityType === 'Asset'
        ? new AssetActions({ isDisabled, onEdit, onRemove, entityFile })
        : new EntryActions({ isDisabled, onEdit, onRemove });
    // Can't just use jsx <EntryActions /> here as dropdownListElements expects
    // a React.Fragment with direct <DropdownList /> children.
    return actions.render();
  };

  render() {
    const {
      entityType,
      contentTypeName,
      entityDescription,
      entityFile,
      entityTitle,
      className,
      size,
      selected,
      entityStatus,
      isLoading,
      onClick,
      href,
      cardDragHandleComponent,
    } = this.props;
    return (
      <EntryCard
        title={entityTitle || 'Untitled'}
        contentType={contentTypeName || (entityType === 'Asset' ? 'Asset' : null)}
        className={className}
        href={href}
        target={href ? '_blank' : undefined}
        rel={href ? 'noopener' : undefined}
        description={entityDescription}
        size={size}
        selected={selected}
        status={entityStatus}
        thumbnailElement={
          entityFile && (
            <Thumbnail file={entityFile} size="70" getExternalImageUrl={getExternalImageUrl} />
          )
        }
        loading={isLoading}
        dropdownListElements={this.renderActions()}
        onClick={onClick}
        cardDragHandleComponent={cardDragHandleComponent}
        withDragHandle={!!cardDragHandleComponent}
      />
    );
  }
}
