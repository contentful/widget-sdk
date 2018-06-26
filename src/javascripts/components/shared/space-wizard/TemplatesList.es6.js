import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

import { get } from 'lodash';

const TemplatesList = createReactClass({
  propTypes: {
    templates: PropTypes.array,
    selectedTemplate: PropTypes.object,
    onSelect: PropTypes.func.isRequired
  },
  render () {
    const {templates, selectedTemplate, onSelect} = this.props;

    if (!templates) {
      return null;
    }

    return (
      <div className="create-new-space__templates__inner">
        <div className="create-new-space__templates__nav">
          {
            templates.map((template) => {
              const isSelected = get(selectedTemplate, 'sys.id') === get(template, 'sys.id');
              // TODO show template.svgicon
              return (
                <a
                  key={get(template, 'sys.id')}
                  className={`create-new-space__templates__navitem ${isSelected && 'selected'}`}
                  data-test-id={`space-template-template.id`}
                  onClick={() => onSelect(template)}>
                  {template.name}
                </a>
              );
            })
          }
        </div>
        {
          selectedTemplate &&
          <div className="create-new-space__templates__description">
            <img
              className="create-new-space__templates__image"
              src={get(selectedTemplate, 'image.fields.file.url')} />
            <div className="create-new-space__templates__text">
              <div dangerouslySetInnerHTML={{__html: selectedTemplate.descriptionV2}} />
            </div>
          </div>
        }
      </div>
    );
  }
});

export default TemplatesList;
