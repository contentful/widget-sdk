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
  afterStateUpdate () {
    const {initial, selfHosted, entity} = this.state;
    const ignoredSrcProp = selfHosted ? 'srcdoc' : 'src';

    const extension = omit(entity.extension, ignoredSrcProp);
    const dirty = !isEqual(initial, {...entity, extension});
    this.setState(state => ({...state, dirty}));

    const cloned = cloneDeep(entity);
    cloned.extension.fieldTypes = cloned.extension.fieldTypes.map(toApiFieldType);
    delete cloned.extension[ignoredSrcProp];
    this.props.onChange({entity: cloned, dirty});
  },
  render () {
    const {initial, selfHosted, entity, dirty} = this.state;
    const {save} = this.props;
    const setState = updater => this.setState(updater, () => this.afterStateUpdate());

    const content = <div style={{padding: '0 2em'}}>
      <ExtensionForm
        entity={entity}
        selfHosted={selfHosted}
        updateEntity={entity => setState(state => ({...state, entity}))}
        setSelfHosted={selfHosted => setState(state => ({...state, selfHosted}))}
      />
    </div>;

    const actions = <React.Fragment>
      <button className="btn-secondary-action" onClick={() => $state.go('.^')}>
        Go back
      </button>
      <button
        className="btn-primary-action"
        disabled={!dirty}
        onClick={() => save().then(entity => setState(() => this.entityToFreshState(entity)))}
      >
        Save
      </button>
    </React.Fragment>;

    return <Workbench
      title={`Extension: ${initial.extension.name}${dirty ? '*' : ''}`}
      icon={'page-settings'}
      content={content}
      actions={actions}
    />;
  }
});

export default ExtensionEditor;
