import React from 'react';
import PropTypes from 'prop-types';
import CfPropTypes from 'utils/CfPropTypes.es6';
import {
  Button,
  FormLabel,
  Option,
  SelectField,
  TextField,
  TextLink,
  Modal,
  Form
} from '@contentful/forma-36-react-components';
import AngularComponent from 'ui/Framework/AngularComponent.es6';
import FetchedEntityCard from 'app/widgets/shared/FetchedEntityCard/index.es6';
import { values, includes } from 'lodash';
import { calculateIdealListHeight, getLabels } from 'search/EntitySelector/Config.es6';
import Visible from 'components/shared/Visible/index.es6';

export const LINK_TYPES = {
  URI: 'uri',
  ENTRY: 'Entry',
  ASSET: 'Asset'
};

function isFeaturingEntitySelector(entitySelectorConfigs = {}) {
  return !!entitySelectorConfigs.Entry || !!entitySelectorConfigs.Asset;
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

export class HyperlinkDialogForm extends React.Component {
  static propTypes = {
    labels: PropTypes.shape({
      title: PropTypes.string
    }),
    value: PropTypes.shape({
      text: PropTypes.string,
      uri: PropTypes.string,
      target: PropTypes.shape(CfPropTypes.linkOf([LINK_TYPES.ENTRY, LINK_TYPES.ASSET])),
      // Will be overwritten accordingly if `uri` or `target.sys.linkType` are set.
      type: PropTypes.oneOf(values(LINK_TYPES))
    }),
    entitySelectorConfigs: PropTypes.object,
    allowedHyperlinkTypes: PropTypes.arrayOf(
      PropTypes.oneOf([LINK_TYPES.ENTRY, LINK_TYPES.ASSET, LINK_TYPES.URI])
    ),
    hideText: PropTypes.bool,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  static defaultProps = {
    labels: {
      title: 'Insert link',
      confirm: 'Insert link'
    },
    value: {},
    hideText: false,
    entitySelectorConfigs: {},
    allowedHyperlinkTypes: [LINK_TYPES.ENTRY, LINK_TYPES.ASSET, LINK_TYPES.URI]
  };

  constructor(props) {
    super(props);

    const { text, type, uri, target } = props.value;
    const isEntityLink = Boolean(target);
    const entityLinks = {
      [LINK_TYPES.ENTRY]: null,
      [LINK_TYPES.ASSET]: null
    };
    let linkType = type;

    if (isEntityLink) {
      linkType = target.sys.linkType;
      entityLinks[linkType] = target;
    } else if (includes(props.allowedHyperlinkTypes, LINK_TYPES.URI)) {
      linkType = LINK_TYPES.URI;
    } else {
      linkType = props.allowedHyperlinkTypes[0];
    }

    this.state = { text, uri, entityLinks, type: linkType };
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
    return (
      <React.Fragment>
        <Modal.Header title={labels.title} onClose={onCancel} />
        <Modal.Content>{this.renderFields()}</Modal.Content>
        <Modal.Controls>
          <Button
            type="submit"
            buttonType="positive"
            onClick={this.handleSubmit}
            disabled={!this.isLinkComplete()}
            testId="confirm-cta">
            {labels.confirm}
          </Button>
          <Button type="button" onClick={onCancel} buttonType="muted" testId="cancel-cta">
            Cancel
          </Button>
        </Modal.Controls>
      </React.Fragment>
    );
  }

  renderFields() {
    const { hideText, allowedHyperlinkTypes, entitySelectorConfigs } = this.props;
    const { uri, text, type } = this.state;

    return (
      <Form>
        {hideText ? null : (
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
          />
        )}
        {isFeaturingEntitySelector(entitySelectorConfigs) && (
          <SelectField
            labelText="Link type"
            value={type}
            onChange={e => this.setState({ type: e.target.value })}
            name="link-type"
            id="link-type"
            selectProps={{ testId: 'link-type-select' }}>
            {/* Show the option if the link type is allowed or the current link is of type that is no longer valid */}
            <Visible
              if={includes(allowedHyperlinkTypes, LINK_TYPES.URI) || type === LINK_TYPES.URI}>
              <Option value={LINK_TYPES.URI}>URL</Option>
            </Visible>

            <Visible
              if={includes(allowedHyperlinkTypes, LINK_TYPES.ENTRY) || type === LINK_TYPES.ENTRY}>
              <Option value={LINK_TYPES.ENTRY}>Entry</Option>
            </Visible>

            <Visible
              if={includes(allowedHyperlinkTypes, LINK_TYPES.ASSET) || type === LINK_TYPES.ASSET}>
              <Option value={LINK_TYPES.ASSET}>Asset</Option>
            </Visible>
          </SelectField>
        )}
        {type === LINK_TYPES.URI ? (
          <TextField
            required
            labelText="Link target"
            value={uri || ''}
            textInputProps={{
              placeholder: 'https://',
              testId: 'link-uri-input',
              autoFocus: true
            }}
            helpText="A protocol may be required, e.g. https://"
            onChange={e => this.setState({ uri: e.target.value })}
            id="link-uri"
            name="link-uri"
          />
        ) : (
          this.renderEntityField()
        )}
      </Form>
    );
  }

  renderEntityField() {
    const { type, entityLinks } = this.state;
    const resetEntity = () => this.setTargetEntity(type, null);
    const entityLink = entityLinks[type];
    const isEntitySelectorVisible = !entityLink;
    return (
      <div>
        <FormLabel required htmlFor="">
          Link target
        </FormLabel>
        {!isEntitySelectorVisible && (
          <TextLink className="entity-selector-dialog__change-selection-link" onClick={resetEntity}>
            Change selection
          </TextLink>
        )}
        {entityLink && (
          <div>
            <FetchedEntityCard
              className="entity-selector-dialog__asset-card"
              entityId={entityLink.sys.id}
              entityType={entityLink.sys.linkType}
              disabled={false}
              selected={false}
              onRemove={resetEntity}
            />
          </div>
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
      return null;
    }
    const labels = getCustomizedLabels(config);
    const otherElementsHeight = this.props.hideText ? 520 : 600;
    const listHeight = calculateIdealListHeight(otherElementsHeight);
    const onChange = ([entity]) => this.setTargetEntity(type, entity);
    const isForCurrentType = this.state.type === type;
    config.withCreate = false;
    return (
      <div
        style={{ display: isForCurrentType && isVisible ? 'block' : 'none' }}
        data-test-id="entity-selector-container">
        <AngularComponent
          template={
            '<cf-entity-selector config="config" labels="labels" list-height="listHeight" on-change="onChange" />'
          }
          scope={{ config, labels, listHeight, onChange }}
        />
      </div>
    );
  }
}

export default function HyperlinkDialog(props) {
  const { onCancel, isShown, entitySelectorConfigs } = props;

  return (
    <Modal
      size="large"
      allowHeightOverflow
      isShown={isShown}
      onClose={onCancel}
      testId="create-hyperlink-dialog"
      className={isFeaturingEntitySelector(entitySelectorConfigs) ? 'entity-selector-dialog' : ''}>
      {() => <HyperlinkDialogForm {...props} />}
    </Modal>
  );
}

HyperlinkDialog.propTypes = {
  onCancel: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
  entitySelectorConfigs: PropTypes.object
};
