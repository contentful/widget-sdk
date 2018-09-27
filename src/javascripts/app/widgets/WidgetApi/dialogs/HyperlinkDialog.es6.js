import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  FormLabel,
  Option,
  SelectField,
  TextField,
  TextLink
} from '@contentful/ui-component-library';
import FetchedReferenceCard from 'app/widgets/structured_text/plugins/shared/FetchedReferenceCard';
import Dialog from 'app/entity_editor/Components/Dialog';
import AngularComponent from 'AngularComponent';
import { noop, values } from 'lodash';
import { calculateIdealListHeight, getLabels } from 'search/EntitySelector/Config.es6';

const LINK_TYPES = {
  URI: 'uri',
  ENTRY: 'Entry',
  ASSET: 'Asset'
};

export default class HyperlinkDialog extends React.Component {
  static propTypes = {
    labels: PropTypes.shape({
      title: PropTypes.string
    }),
    value: PropTypes.shape({
      text: PropTypes.string,
      uri: PropTypes.string,
      target: PropTypes.shape({
        sys: PropTypes.shape({
          id: PropTypes.string,
          linkType: PropTypes.oneOf([LINK_TYPES.ENTRY, LINK_TYPES.ASSET])
        })
      }),
      // Will be overwritten accordingly if `uri` or `target.sys.linkType` are set.
      type: PropTypes.oneOf(values(LINK_TYPES))
    }),
    entitySelectorConfigs: PropTypes.object,
    hideText: PropTypes.bool,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    // TODO: Remove once we have better solution for re-center modal dialog:
    onRender: PropTypes.func
  };

  static defaultProps = {
    labels: {
      title: 'Insert link',
      confirm: 'Insert link'
    },
    value: {
      type: LINK_TYPES.URI,
      uri: 'https://'
    },
    hideText: false,
    onRender: noop,
    entitySelectorConfigs: {}
  };

  constructor(props) {
    super(props);

    const { text, type: maybeType, uri, target } = {
      ...HyperlinkDialog.defaultProps.value,
      ...props.value
    };
    const type = target ? target.sys.linkType : maybeType;
    const entityLinks = {
      [LINK_TYPES.ENTRY]: null,
      [LINK_TYPES.ASSET]: null
    };
    if (target) {
      entityLinks[type] = target;
    }
    this.state = { text, uri, entityLinks, type };
  }

  setTargetEntity(type, entity) {
    const entityLinks = {
      ...this.state.entityLinks,
      [type]: entity ? entityToLink(entity) : undefined
    };
    this.setState({ entityLinks });
  }

  getValue() {
    const { text, type, uri } = this.state;
    const value = { type };
    if (text) {
      value.text = text;
    }
    if (type === LINK_TYPES.URI) {
      value.uri = uri;
    } else {
      value.target = this.state.entityLinks[type];
    }
    return value;
  }

  isFeaturingEntitySelector() {
    const { entitySelectorConfigs } = this.props;
    return !!entitySelectorConfigs.Entry || !!entitySelectorConfigs.Asset;
  }

  isLinkComplete() {
    const { text, type, uri, target } = this.getValue();
    const requiresText = !this.props.hideText;
    if (requiresText && !text) {
      return false;
    }
    return (type === LINK_TYPES.URI && uri) || target;
  }

  handleSubmit = event => {
    event.preventDefault();
    this.props.onConfirm(this.getValue());
  };

  render() {
    const { labels, onCancel } = this.props;
    this.props.onRender();
    return (
      <Dialog
        testId="create-hyperlink-dialog"
        className={this.isFeaturingEntitySelector ? 'entity-selector-dialog' : ''}>
        <Dialog.Header onCloseButtonClicked={onCancel}>{labels.title}</Dialog.Header>
        <form onSubmit={this.handleSubmit}>
          <Dialog.Body>{this.renderFields()}</Dialog.Body>
          <Dialog.Controls>
            <Button
              type="submit"
              buttonType="positive"
              disabled={!this.isLinkComplete()}
              data-test-id="confirm-cta">
              {labels.confirm}
            </Button>
            <Button type="button" onClick={onCancel} buttonType="muted" data-test-id="cancel-cta">
              Cancel
            </Button>
          </Dialog.Controls>
        </form>
      </Dialog>
    );
  }

  renderFields() {
    // TODO: Use `Form` for spacing once available in component library.
    const style = { marginBottom: '1.75rem' };
    const { hideText, entitySelectorConfigs } = this.props;
    const { uri, text, type } = this.state;

    return (
      <React.Fragment>
        {hideText || (
          <TextField
            required
            labelText="Link text"
            value={text || ''}
            onChange={e => this.setState({ text: e.target.value })}
            id="link-text"
            name="link-text"
            textInputProps={{
              testId: 'link-text-input'
            }}
            style={style}
          />
        )}
        {this.isFeaturingEntitySelector() > 0 && (
          <SelectField
            labelText="Link type"
            value={type}
            onChange={e => this.setState({ type: e.target.value })}
            name="link-type"
            id="link-type"
            selectProps={{ testId: 'link-type-select' }}
            style={style}>
            <Option value={LINK_TYPES.URI}>URL</Option>
            {entitySelectorConfigs.Entry && <Option value={LINK_TYPES.ENTRY}>Entry</Option>}
            {entitySelectorConfigs.Asset && <Option value={LINK_TYPES.ASSET}>Asset</Option>}
          </SelectField>
        )}
        {type === LINK_TYPES.URI ? (
          <TextField
            required
            labelText="Link target"
            value={uri || ''}
            textInputProps={{ placeholder: 'https://', testId: 'link-uri-input' }}
            helpText="A protocol may be required, e.g. https://"
            onChange={e => this.setState({ uri: e.target.value })}
            id="link-uri"
            name="link-uri"
            style={style}
          />
        ) : (
          this.renderEntityField()
        )}
      </React.Fragment>
    );
  }

  renderEntityField() {
    const { type } = this.state;
    const resetEntity = () => this.setTargetEntity(type, null);
    const entityLink = this.state.entityLinks[type];
    const isEntitySelectorVisible = !entityLink;
    return (
      <div>
        <FormLabel required htmlFor="">
          Link target
        </FormLabel>
        {!isEntitySelectorVisible && (
          <TextLink
            extraClassNames="entity-selector-dialog__change-selection-link"
            onClick={resetEntity}>
            Change selection
          </TextLink>
        )}
        {entityLink && (
          <FetchedReferenceCard
            entityId={entityLink.sys.id}
            entityType={entityLink.sys.linkType}
            disabled={false}
            selected={false}
            onRemove={resetEntity}
          />
        )}
        {/* Keep all entity selectors in the DOM for super fast types switching ux.*/}
        {this.renderEntitySelector(LINK_TYPES.ENTRY, isEntitySelectorVisible)}
        {this.renderEntitySelector(LINK_TYPES.ASSET, isEntitySelectorVisible)}
      </div>
    );
  }

  renderEntitySelector(type, isVisible) {
    const config = this.props.entitySelectorConfigs[type];
    if (!config) {
      return <React.Fragment />;
    }
    const labels = getCustomizedLabels(config);
    const otherElementsHeight = this.props.hideText ? 520 : 600;
    const listHeight = calculateIdealListHeight(otherElementsHeight);
    const onChange = ([entity]) => this.setTargetEntity(type, entity);
    const isForCurrentType = this.state.type === type;
    return (
      <div style={{ display: isForCurrentType && isVisible ? 'block' : 'none' }}>
        <AngularComponent
          template={`<cf-entity-selector config="config" labels="labels" list-height="listHeight" on-change="onChange" />`}
          scope={{ config, labels, listHeight, onChange }}
        />
      </div>
    );
  }
}

function entityToLink(entity) {
  const { id, type } = entity.sys;
  return { sys: { id, type: 'Link', linkType: type } };
}

function getCustomizedLabels(config) {
  const labels = getLabels(config);
  labels.info = labels.info.replace(/insert/g, 'choose');
  delete labels.input;
  return labels;
}
