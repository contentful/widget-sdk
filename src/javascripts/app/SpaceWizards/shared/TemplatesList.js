import React from 'react';
import PropTypes from 'prop-types';

import { get } from 'lodash';

export default function TemplatesList(props) {
  const { templates, selectedTemplate, onSelect } = props;

  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <div data-test-id="template-list-wrapper" className="create-new-space__templates__inner">
      <div className="create-new-space__templates__nav">
        {templates.map((template) => {
          const isSelected = get(selectedTemplate, 'sys.id') === get(template, 'sys.id');
          return (
            <div
              key={get(template, 'sys.id')}
              className={`create-new-space__templates__navitem ${isSelected && 'selected'}`}
              data-test-id={`space-template-template.id`}
              onClick={() => onSelect(template)}>
              {template.name}
            </div>
          );
        })}
      </div>
      {selectedTemplate && (
        <div
          data-test-id="selected-template-details"
          className="create-new-space__templates__description">
          <img
            className="create-new-space__templates__image"
            src={get(selectedTemplate, 'image.fields.file.url')}
          />
          <div className="create-new-space__templates__text">
            <div dangerouslySetInnerHTML={{ __html: selectedTemplate.descriptionV2 }} />
          </div>
        </div>
      )}
    </div>
  );
}

TemplatesList.propTypes = {
  templates: PropTypes.array,
  selectedTemplate: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
};
