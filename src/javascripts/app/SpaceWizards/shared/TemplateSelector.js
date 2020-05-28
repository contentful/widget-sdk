import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import TemplatesToggle from './TemplatesToggle';
import TemplatesList from './TemplatesList';

export default function TemplateSelector(props) {
  const { onSelect, templates, formAlign, selectedTemplate } = props;

  const [templatesVisible, setTemplatesVisible] = useState(false);

  useEffect(() => {
    if (!templatesVisible) {
      onSelect(null);
    } else if (!selectedTemplate) {
      onSelect(templates[0]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate, templatesVisible]);

  return (
    <div>
      <TemplatesToggle
        isShowingTemplates={templatesVisible}
        onChange={(val) => setTemplatesVisible(val)}
        formAlign={formAlign}
      />
      {templatesVisible && (
        <div className="modal-dialog__slice create-new-space__templates">
          <TemplatesList
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelect={(template) => onSelect(template)}
          />
        </div>
      )}
    </div>
  );
}

TemplateSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
  templates: PropTypes.array.isRequired,
  formAlign: PropTypes.oneOf(['left', 'center']),
  selectedTemplate: PropTypes.object,
};
