import React from 'react';
import PropTypes from 'prop-types';
import { get, cloneDeep, isEqual, omit } from 'lodash';
import $state from '$state';
import Workbench from 'app/WorkbenchReact.es6';
import { track } from 'analytics/Analytics.es6';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils.es6';
import getExtensionParameterIds from './getExtensionParameterIds.es6';

import { toInternalFieldType, toApiFieldType } from './FieldTypes.es6';
import ExtensionForm from './ExtensionForm.es6';

class ExtensionEditor extends React.Component {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired
  };

  // TODO: use `getDerivedStateFromProps`
  entityToFreshState = entity => {
    const initial = cloneDeep(entity);
    initial.extension.fieldTypes = initial.extension.fieldTypes.map(toInternalFieldType);
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
      saving: false
    };
  };

  state = this.entityToFreshState(this.props.entity);

  ignoredSrcProp = () => {
    return this.state.selfHosted ? 'srcdoc' : 'src';
  };

  componentDidUpdate() {
    // Every time we update the component we want to call the `onChange`
    // prop to notify outside world about changes introduced to the entity;
    // the reason is that saving logic must live in Angular world because
    // it is used by `leaveConfirmator`.
    const entity = cloneDeep(this.state.entity);
    entity.extension.fieldTypes = entity.extension.fieldTypes.map(toApiFieldType);
    delete entity.extension[this.ignoredSrcProp()];
    this.props.onChange({ entity, dirty: this.isDirty() });
  }

  isDirty = () => {
    const { entity, initial } = this.state;
    const extension = omit(entity.extension, this.ignoredSrcProp());
    return !isEqual(initial, { ...entity, extension });
  };

  render() {
    const dirty = this.isDirty();

    return (
      <Workbench
        title={`Extension: ${this.state.initial.extension.name}${dirty ? '*' : ''}`}
        icon="page-settings"
        content={this.renderContent()}
        actions={this.renderActions(dirty)}
      />
    );
  }

  renderContent = () => {
    return (
      <div className="extension-form">
        <ExtensionForm
          entity={this.state.entity}
          selfHosted={this.state.selfHosted}
          updateEntity={entity => this.setState({ entity })}
          setSelfHosted={selfHosted => this.setState({ selfHosted })}
        />
      </div>
    );
  };

  renderActions = dirty => {
    return (
      <React.Fragment>
        <button className="btn-secondary-action" onClick={() => $state.go('.^')}>
          Close
        </button>
        <button
          className="btn-primary-action"
          disabled={!dirty || this.state.saving}
          onClick={() => this.save()}>
          Save
        </button>
      </React.Fragment>
    );
  };

  save = () => {
    this.setState({ saving: true });
    this.props
      .save() // `this.props.save()` takes care of displaying success/error messages
      .then(
        entity => {
          this.setState(
            () => this.entityToFreshState(entity),
            () => {
              const { extension } = this.state.entity;

              track('extension:save', {
                ui_extension_id: this.state.entity.sys.id,
                name: extension.name,
                version: this.state.entity.sys.version,
                fieldTypes: extension.fieldTypes,
                ...getExtensionParameterIds(extension)
              });
            }
          );
        },
        () => this.setState({ saving: false })
      );
  };
}

export default ExtensionEditor;
