import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { get, cloneDeep, isEqual, omit } from 'lodash';
import { Notification, Button } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils';
import { getExtensionParameterIds } from './getExtensionParameterIds';
import StateLink from 'app/common/StateLink';
import { toInternalFieldType, toApiFieldType } from 'widgets/FieldTypes';
import { ExtensionForm } from './ExtensionForm';
import * as Analytics from 'analytics/Analytics';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';
import { ExtensionEditorSkeleton } from './skeletons/ExtensionEditorSkeleton';

const styles = {
  actionButton: css({
    marginRight: tokens.spacingM,
  }),
};

export class ExtensionEditor extends React.Component {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    setDirty: PropTypes.func.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    goToList: PropTypes.func.isRequired,
    cma: PropTypes.shape({
      updateExtension: PropTypes.func.isRequired,
    }).isRequired,
  };

  // TODO: use `getDerivedStateFromProps`
  entityToFreshState = (entity) => {
    const initial = cloneDeep(entity);
    initial.extension.fieldTypes = (initial.extension.fieldTypes || []).map(toInternalFieldType);
    initial.parameters = WidgetParametersUtils.applyDefaultValues(
      get(initial, ['extension', 'parameters', 'installation']) || [],
      initial.parameters
    );

    // `sidebar` property is not required and can be either `false` or `undefined`
    // when falsy. We cast it to boolean so the entity doesn't get dirty.
    initial.extension.sidebar = !!initial.extension.sidebar;

    return {
      initial,
      selfHosted: typeof initial.extension.src === 'string',
      entity: cloneDeep(initial),
      saving: false,
    };
  };

  state = this.entityToFreshState(this.props.entity);

  ignoredSrcProp = () => {
    return this.state.selfHosted ? 'srcdoc' : 'src';
  };

  componentDidMount() {
    this.props.registerSaveAction(this.save);
  }

  componentDidUpdate() {
    this.props.setDirty(this.isDirty());
  }

  prepareForSave(entity) {
    const result = cloneDeep(entity);
    result.extension.fieldTypes = result.extension.fieldTypes.map(toApiFieldType);
    delete result.extension[this.ignoredSrcProp()];
    return result;
  }

  isDirty = () => {
    const { entity, initial } = this.state;
    const extension = omit(entity.extension, this.ignoredSrcProp());
    return !isEqual(initial, { ...entity, extension });
  };

  save = () => {
    this.setState({ saving: true });
    const entity = this.prepareForSave(this.state.entity);
    return this.props.cma
      .updateExtension(entity)
      .then((newEntity) => {
        this.setState(
          () => this.entityToFreshState(newEntity),
          () => {
            const { sys, extension } = this.state.entity;

            Analytics.track('extension:save', {
              ui_extension_id: sys.id,
              name: extension.name,
              version: sys.version,
              fieldTypes: extension.fieldTypes,
              ...getExtensionParameterIds(extension),
            });

            Notification.success('Your extension was updated successfully.');

            getCustomWidgetLoader().evict([NAMESPACE_EXTENSION, sys.id]);
          }
        );
      })
      .catch(() => {
        Notification.error(
          [
            'There was an error while saving your extension.',
            'See validation errors for more details.',
          ].join(' ')
        );
        this.setState({ saving: false });
      });
  };

  renderContent = () => {
    return (
      <div className="extension-form">
        <ExtensionForm
          entity={this.state.entity}
          selfHosted={this.state.selfHosted}
          updateEntity={(entity) => this.setState({ entity })}
          setSelfHosted={(selfHosted) => this.setState({ selfHosted })}
        />
      </div>
    );
  };

  renderActions = (dirty) => {
    return (
      <React.Fragment>
        <StateLink path="^.list">
          {({ onClick }) => (
            <Button className={styles.actionButton} buttonType="muted" onClick={onClick}>
              Close
            </Button>
          )}
        </StateLink>
        <Button
          buttonType="positive"
          disabled={!dirty || this.state.saving}
          onClick={() => this.save()}>
          Save
        </Button>
      </React.Fragment>
    );
  };

  render() {
    const dirty = this.isDirty();

    return (
      <ExtensionEditorSkeleton
        goToList={this.props.goToList}
        title={`Extension: ${this.state.initial.extension.name}${dirty ? '*' : ''}`}
        actions={this.renderActions(dirty)}>
        {this.renderContent()}
      </ExtensionEditorSkeleton>
    );
  }
}
