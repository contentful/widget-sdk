import React from 'react';
import PropTypes from 'prop-types';
import { get, cloneDeep, isEqual, omit } from 'lodash';
import {
  Notification,
  SkeletonContainer,
  SkeletonBodyText,
  SkeletonDisplayText
} from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils.es6';
import getExtensionParameterIds from './getExtensionParameterIds.es6';
import StateLink from 'app/common/StateLink.es6';
import { toInternalFieldType, toApiFieldType } from 'widgets/FieldTypes.es6';
import ExtensionForm from './ExtensionForm.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
const Analytics = getModule('analytics/Analytics.es6');

export const ExtensionEditorShell = props => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Header.Back to="^.list" />
      <Workbench.Icon icon="page-settings" />
      <Workbench.Title>
        {props.title || (
          <SkeletonContainer svgHeight={21} clipId="header">
            <SkeletonDisplayText lineHeight={21} />
          </SkeletonContainer>
        )}
      </Workbench.Title>
      <Workbench.Header.Actions>{props.actions}</Workbench.Header.Actions>
    </Workbench.Header>
    <Workbench.Content>
      {props.children || (
        <SkeletonContainer svgWidth={600} ariaLabel="Loading extension..." clipId="content">
          <SkeletonBodyText numberOfLines={5} offsetLeft={28} marginBottom={15} offsetTop={18} />
        </SkeletonContainer>
      )}
    </Workbench.Content>
  </Workbench>
);

ExtensionEditorShell.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.node
};

class ExtensionEditor extends React.Component {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    setDirty: PropTypes.func.isRequired,
    registerSaveAction: PropTypes.func.isRequired
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
    return spaceContext.cma
      .updateExtension(entity)
      .then(newEntity => {
        this.setState(
          () => this.entityToFreshState(newEntity),
          () => {
            const { extension } = this.state.entity;
            Analytics.track('extension:save', {
              ui_extension_id: this.state.entity.sys.id,
              name: extension.name,
              version: this.state.entity.sys.version,
              fieldTypes: extension.fieldTypes,
              ...getExtensionParameterIds(extension)
            });
          }
        );
        Notification.success('Your extension was updated successfully.');
      })
      .catch(() => {
        Notification.error(
          [
            'There was an error while saving your extension.',
            'See validation errors for more details.'
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
          updateEntity={entity => this.setState({ entity })}
          setSelfHosted={selfHosted => this.setState({ selfHosted })}
        />
      </div>
    );
  };

  renderActions = dirty => {
    return (
      <React.Fragment>
        <StateLink to="^.list">
          {({ onClick }) => (
            <button className="btn-secondary-action" onClick={onClick}>
              Close
            </button>
          )}
        </StateLink>
        <button
          className="btn-primary-action"
          disabled={!dirty || this.state.saving}
          onClick={() => this.save()}>
          Save
        </button>
      </React.Fragment>
    );
  };

  render() {
    const dirty = this.isDirty();

    return (
      <ExtensionEditorShell
        title={`Extension: ${this.state.initial.extension.name}${dirty ? '*' : ''}`}
        actions={this.renderActions(dirty)}>
        {this.renderContent()}
      </ExtensionEditorShell>
    );
  }
}

export default ExtensionEditor;
