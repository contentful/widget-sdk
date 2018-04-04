import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {get} from 'lodash';
import {getTemplatesList} from 'services/SpaceTemplateLoader';

const TemplateSelector = createReactClass({
  propTypes: {
    onSelect: PropTypes.func.isRequired,
    onDimensionsChange: PropTypes.func
  },
  getInitialState: function () {
    return {
      templates: [],
      useTemplate: false,
      selectedTemplate: null
    };
  },
  componentWillMount: async function () {
    const templatesList = await getTemplatesList();
    const templates = parseTemplates(templatesList);
    this.setState(Object.assign(this.state, {templates}));
  },
  render: function () {
    const {templates, useTemplate, selectedTemplate} = this.state;

    return h('div', null,
      h('div', {className: 'cfnext-form__field create-new-space__form__radios'},
        h('div', {className: 'cfnext-form-option create-new-space__form__option'},
          h('input', {
            id: 'newspace-template-none',
            type: 'radio',
            name: 'useTemplate',
            value: 'false',
            checked: !useTemplate,
            onChange: this.hideTemplates
          }),
          h('label', {htmlFor: 'newspace-template-none'},
            h('strong', null, 'Create an empty space.'),
            h('span', {className: 'create-new-space__form__label-description'},
              ' I’ll fill it with my own content.'
            )
          )
        ),
        h('div', {className: 'cfnext-form-option create-new-space__form__option'},
          h('input', {
            id: 'newspace-template-usetemplate',
            type: 'radio',
            name: 'useTemplate',
            value: 'true',
            checked: useTemplate,
            onChange: this.showTemplates
          }),
          h('label', {htmlFor: 'newspace-template-usetemplate'},
            h('strong', null, 'Create an example space.'),
            h('span', {className: 'create-new-space__form__label-description'},
              ' I’d like to see how things work first.'
            )
          )
        )
      ),
      h('div', {
        className: `modal-dialog__slice create-new-space__templates ${useTemplate ? 'open' : 'close'}`
      },
        h('div', {className: 'create-new-space__templates__inner'},
          h('div', {className: 'create-new-space__templates__nav'},
            templates.map((template) => {
              const isSelected = get(selectedTemplate, 'id') === template.id;
              return h('a', {
                key: template.id,
                className: `create-new-space__templates__navitem ${isSelected && 'selected'}`,
                onClick: this.selectTemplate(template)
              },
                // TODO show template.svgicon
                template.name
              );
            })
          ),
          selectedTemplate && h('div', {className: 'create-new-space__templates__description'},
            h('img', {
              className: 'create-new-space__templates__image',
              src: get(selectedTemplate, 'image.fields.file.url')
            }),
            h('div', {className: 'create-new-space__templates__text'},
              h('div', {dangerouslySetInnerHTML: {__html: selectedTemplate.descriptionV2}})
            )
          )
        )
      )
    );
  },
  hideTemplates: function () {
    this.setState(Object.assign(this.state, {useTemplate: false, selectedTemplate: null}));
    this.props.onSelect(null);
    this.dimensionsChange();
  },
  showTemplates: function () {
    const {templates} = this.state;
    const selectedTemplate = templates[0];
    this.setState(Object.assign(this.state, {useTemplate: true, selectedTemplate}));
    this.props.onSelect(selectedTemplate);
    this.dimensionsChange();
  },
  selectTemplate: function (template) {
    return () => {
      this.setState(Object.assign(this.state, {selectedTemplate: template}));
      this.props.onSelect(template);
    };
  },
  dimensionsChange: function () {
    setTimeout(this.props.onDimensionsChange, 250); // animation timeout
  }
});

function parseTemplates (templates = []) {
  return templates.map(({fields, sys}) => ({...fields, id: sys.id}));
}

export default TemplateSelector;
