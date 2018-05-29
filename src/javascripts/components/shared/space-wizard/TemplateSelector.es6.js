import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {get} from 'lodash';
import {RequestState} from './WizardUtils';
import FetchTemplates from './FetchTemplates';
import spinner from 'ui/Components/Spinner';
import {asReact} from 'ui/Framework/DOMRenderer';

const TemplateSelector = createReactClass({
  propTypes: {
    onSelect: PropTypes.func.isRequired
  },
  getInitialState () {
    return {
      isShowingTemplates: false,
      selectedTemplate: null
    };
  },
  render () {
    const {selectedTemplate, isShowingTemplates} = this.state;
    const templatesListClassName = classnames(
      'modal-dialog__slice',
      'create-new-space__templates',
      {
        'open': isShowingTemplates,
        'close': !isShowingTemplates
      }
    );

    return (
      <FetchTemplates>
        {({requestState, templates}) => (
          <div>
            {requestState === RequestState.PENDING && <div>
              <TemplatesToggle
                isShowingTemplates={isShowingTemplates}
                onChange={(value) => this.setState({isShowingTemplates: value})}
              />
              <div className={templatesListClassName}>
                <div className="loader__container">
                  {asReact(spinner({diameter: '40px'}))}
                </div>
              </div>
            </div>}
            {requestState === RequestState.SUCCESS && <div>
              <TemplatesToggle
                isShowingTemplates={isShowingTemplates}
                onChange={(value) => {
                  this.selectTemplate(value ? get(templates, '[0]') : null);
                }}
              />
              <div className={templatesListClassName}>
                {selectedTemplate && <TemplatesList
                  templates={templates}
                  selectedTemplate={selectedTemplate}
                  onSelect={this.selectTemplate}
                />}
              </div>
            </div>}
            {requestState === RequestState.ERROR && <div className="note-box--warning">
              <p>Could not fetch space templates.</p>
            </div>}
          </div>
        )}
      </FetchTemplates>
    );
  },
  selectTemplate (selectedTemplate) {
    this.props.onSelect(selectedTemplate);

    const isShowingTemplates = !!selectedTemplate;
    this.setState({selectedTemplate, isShowingTemplates});
  }
});

const TemplatesToggle = createReactClass({
  propTypes: {
    isShowingTemplates: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
  },
  render () {
    const {isShowingTemplates, onChange} = this.props;
    return (
      <div className="cfnext-form__field create-new-space__form__radios create-space-wizard__centered-block">
        <div className="cfnext-form-option create-new-space__form__option">
          <input
            id="newspace-template-none"
            type="radio"
            name="isShowingTemplates"
            value="false"
            checked={!isShowingTemplates}
            onChange={() => onChange(false)} />
          <label htmlFor="newspace-template-none">
            <strong>Create an empty space. </strong>
            <span className="create-new-space__form__label-description">
              I’ll fill it with my own content.
            </span>
          </label>
        </div>
        <div className="cfnext-form-option create-new-space__form__option">
          <input
            id="newspace-template-usetemplate"
            type="radio"
            name="isShowingTemplates"
            value="true"
            checked={isShowingTemplates}
            onChange={() => onChange(true)} />
          <label htmlFor="newspace-template-usetemplate">
            <strong>Create an example space. </strong>
            <span className="create-new-space__form__label-description">
              I’d like to see how things work first.
            </span>
          </label>
        </div>
      </div>
    );
  }
});

const TemplatesList = createReactClass({
  propTypes: {
    templates: PropTypes.array.isRequired,
    selectedTemplate: PropTypes.object,
    onSelect: PropTypes.func.isRequired
  },
  render () {
    const {templates, selectedTemplate, onSelect} = this.props;
    return (
      <div className="create-new-space__templates__inner">
        <div className="create-new-space__templates__nav">
          {templates.map((template) => {
            const isSelected = get(selectedTemplate, 'id') === template.id;
            // TODO show template.svgicon
            return (
              <a
                key={template.id}
                className={`create-new-space__templates__navitem ${isSelected && 'selected'}`}
                data-test-id={`space-template-template.id`}
                onClick={() => onSelect(template)}>
                {template.name}
              </a>
            );
          })}
        </div>
        {selectedTemplate && (
          <div className="create-new-space__templates__description">
            <img
              className="create-new-space__templates__image"
              src={get(selectedTemplate, 'image.fields.file.url')} />
            <div className="create-new-space__templates__text">
              <div dangerouslySetInnerHTML={{__html: selectedTemplate.descriptionV2}} />
            </div>
          </div>
        )}
      </div>
    );
  }
});

export default TemplateSelector;
