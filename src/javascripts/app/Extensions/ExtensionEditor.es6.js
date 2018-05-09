import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {get, cloneDeep, isEqual, omit} from 'lodash';
import $state from '$state';
import Workbench from 'app/WorkbenchReact';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils';

import {toInternalFieldType, toApiFieldType} from './FieldTypes';
import ExtensionForm from './ExtensionForm';

const ExtensionEditor = createReactClass({
  propTypes: {
    entity: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired
  },
  // TODO: use `getDerivedStateFromProps`
  entityToFreshState (entity) {
    const initial = cloneDeep(entity);
    initial.extension.fieldTypes = initial.extension.fieldTypes.map(toInternalFieldType);
    initial.parameters = WidgetParametersUtils.applyDefaultValues(
      get(initial, ['extension', 'parameters', 'installation']) || [],
      initial.parameters
    );

    return {
      initial,
      selfHosted: typeof initial.extension.src === 'string',
      entity: cloneDeep(initial),
      saving: false
    };
  },
  getInitialState () {
    return this.entityToFreshState(this.props.entity);
  },
  ignoredSrcProp () {
    return this.state.selfHosted ? 'srcdoc' : 'src';
  },
  componentDidUpdate () {
    // Every time we update the component we want to call the `onChange`
    // prop to notify outside world about changes introduced to the entity;
    // the reason is that saving logic must live in Angular world because
    // it is used by `leaveConfirmator`.
    const entity = cloneDeep(this.state.entity);
    entity.extension.fieldTypes = entity.extension.fieldTypes.map(toApiFieldType);
    delete entity.extension[this.ignoredSrcProp()];
    this.props.onChange({entity, dirty: this.isDirty()});
  },
  isDirty () {
    const {entity, initial} = this.state;
    const extension = omit(entity.extension, this.ignoredSrcProp());
    return !isEqual(initial, {...entity, extension});
  },
  render () {
    const dirty = this.isDirty();

    return <Workbench
      title={`Extension: ${this.state.initial.extension.name}${dirty ? '*' : ''}`}
      icon="page-settings"
      content={this.renderContent()}
      actions={this.renderActions(dirty)}
    />;
  },
  renderContent () {
    return <div className="extension-form">
      <ExtensionForm
        entity={this.state.entity}
        selfHosted={this.state.selfHosted}
        updateEntity={entity => this.setState({entity})}
        setSelfHosted={selfHosted => this.setState({selfHosted})}
      />
    </div>;
  },
  renderActions (dirty) {
    return <React.Fragment>
      <button className="btn-secondary-action" onClick={() => $state.go('.^')}>
        Cancel
      </button>
      <button
        className="btn-primary-action"
        disabled={!dirty || this.state.saving}
        onClick={() => this.save()}
      >
        Save
      </button>
    </React.Fragment>;
  },
  save () {
    this.setState({saving: true});
    this.props.save() // `this.props.save()` takes care of displaying success/error messages
    .then(
      entity => this.setState(() => this.entityToFreshState(entity)),
      () => this.setState({saving: false})
    );
  }
});

export default ExtensionEditor;
