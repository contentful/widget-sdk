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
      dirty: false
    };
  },
  getInitialState () {
    return this.entityToFreshState(this.props.entity);
  },
  // Every time we update the state we have to do two things:
  // 1. check if the current entity representation differs from
  //    the initial entity value and mark as dirty if so
  // 2. call `onChange` to notify outside world about changes
  //    introduced to the entity; the reason is that saving
  //    logic lives in Angular world (is used by `leaveConfirmator`)
  afterStateUpdate () {
    const {initial, selfHosted, entity} = this.state;
    // We don't want to change entity right away so a user can
    // feely switch between hosted and self-hosted options w/o
    // loosing values provided. State of the radio buttons is
    // stored in `selfHosted` and only entity to be saved will
    // skip one of properties.
    const ignoredSrcProp = selfHosted ? 'srcdoc' : 'src';

    const extension = omit(entity.extension, ignoredSrcProp);
    const dirty = !isEqual(initial, {...entity, extension});
    // We are aware it rerenders. Subtrees affected are small.
    this.setState(state => ({...state, dirty}));

    const cloned = cloneDeep(entity);
    cloned.extension.fieldTypes = cloned.extension.fieldTypes.map(toApiFieldType);
    delete cloned.extension[ignoredSrcProp];
    this.props.onChange({entity: cloned, dirty});
  },
  render () {
    const {initial, dirty} = this.state;
    const setState = updater => this.setState(updater, () => this.afterStateUpdate());

    return <Workbench
      title={`Extension: ${initial.extension.name}${dirty ? '*' : ''}`}
      icon="page-settings"
      content={this.renderContent(setState)}
      actions={this.renderActions(setState)}
    />;
  },
  renderContent (setState) {
    const {entity, selfHosted} = this.state;

    return <div className="extension-form">
      <ExtensionForm
        entity={entity}
        selfHosted={selfHosted}
        updateEntity={entity => setState(state => ({...state, entity}))}
        setSelfHosted={selfHosted => setState(state => ({...state, selfHosted}))}
      />
    </div>;
  },
  renderActions (setState) {
    const {dirty} = this.state;
    const {save} = this.props;

    return <React.Fragment>
      <button className="btn-secondary-action" onClick={() => $state.go('.^')}>
        Cancel
      </button>
      <button
        className="btn-primary-action"
        disabled={!dirty}
        onClick={() => save().then(entity => setState(() => this.entityToFreshState(entity)))}
      >
        Save
      </button>
    </React.Fragment>;
  }
});

export default ExtensionEditor;
