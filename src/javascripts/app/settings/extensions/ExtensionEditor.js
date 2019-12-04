import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { get, cloneDeep, isEqual, omit } from 'lodash';
import {
  Notification,
  SkeletonContainer,
  SkeletonBodyText,
  SkeletonDisplayText,
  Heading,
  Button
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import Icon from 'ui/Components/Icon';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils';
import getExtensionParameterIds from './getExtensionParameterIds';
import StateLink from 'app/common/StateLink';
import { toInternalFieldType, toApiFieldType } from 'widgets/FieldTypes';
import ExtensionForm from './ExtensionForm';
import * as Analytics from 'analytics/Analytics';

const styles = {
  actionButton: css({
    marginRight: tokens.spacingM
  })
};

export const ExtensionEditorShell = props => (
  <Workbench>
    <Workbench.Header
      onBack={() => {
        props.goToList();
      }}
      icon={<Icon name="page-settings" scale="0.8" />}
      title={
        <>
          {props.title && <Heading>{props.title}</Heading>}
          {!props.title && (
            <SkeletonContainer svgHeight={21} clipId="header">
              <SkeletonDisplayText lineHeight={21} />
            </SkeletonContainer>
          )}
        </>
      }
      actions={props.actions}
    />
    <Workbench.Content>
      {props.children || (
        <SkeletonContainer
          svgWidth={600}
          svgHeight={300}
          ariaLabel="Loading extension..."
          clipId="content">
          <SkeletonBodyText numberOfLines={5} offsetLeft={28} marginBottom={15} offsetTop={18} />
        </SkeletonContainer>
      )}
    </Workbench.Content>
  </Workbench>
);

ExtensionEditorShell.propTypes = {
  goToList: PropTypes.func.isRequired,
  title: PropTypes.string,
  actions: PropTypes.node
};

class ExtensionEditor extends React.Component {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    setDirty: PropTypes.func.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    goToList: PropTypes.func.isRequired,
    cma: PropTypes.shape({
      updateExtension: PropTypes.func.isRequired
    }).isRequired,
    customWidgetLoader: PropTypes.shape({
      evict: PropTypes.func.isRequired
    }).isRequired
  };

  // TODO: use `getDerivedStateFromProps`
  entityToFreshState = entity => {
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
    return this.props.cma
      .updateExtension(entity)
      .then(newEntity => {
        this.setState(
          () => this.entityToFreshState(newEntity),
          () => {
            const { sys, extension } = this.state.entity;

            Analytics.track('extension:save', {
              ui_extension_id: sys.id,
              name: extension.name,
              version: sys.version,
              fieldTypes: extension.fieldTypes,
              ...getExtensionParameterIds(extension)
            });

            Notification.success('Your extension was updated successfully.');

            this.props.customWidgetLoader.evict(sys.id);
          }
        );
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
      <ExtensionEditorShell
        goToList={this.props.goToList}
        title={`Extension: ${this.state.initial.extension.name}${dirty ? '*' : ''}`}
        actions={this.renderActions(dirty)}>
        {this.renderContent()}
      </ExtensionEditorShell>
    );
  }
}

export default ExtensionEditor;
