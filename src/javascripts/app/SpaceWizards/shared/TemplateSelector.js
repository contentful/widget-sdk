import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { usePrevious } from 'core/hooks';

import TemplatesToggle from './TemplatesToggle';
import TemplatesList from './TemplatesList';

export default function TemplateSelector(props) {
  const { onSelect, templates, formAlign, selectedTemplate, isNewSpacePurchaseFlow } = props;

  const [templatesVisible, setTemplatesVisible] = useState(false);
  const prevState = usePrevious({ selectedTemplate, templatesVisible });

  useEffect(() => {
    // if templates are visible, select the first one by default
    if (templatesVisible && !selectedTemplate) {
      onSelect(templates[0]);
    }

    // using previous value here because we only want to reset the selection when user "give up" of selecting a template
    if (prevState?.templatesVisible && !templatesVisible) {
      onSelect(null);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate, templatesVisible, prevState]);

  return (
    <div>
      <TemplatesToggle
        isShowingTemplates={templatesVisible}
        onChange={(val) => setTemplatesVisible(val)}
        formAlign={formAlign}
        isNewSpacePurchaseFlow={isNewSpacePurchaseFlow}
      />
      {templatesVisible && (
        <div
          className={
            isNewSpacePurchaseFlow ? '' : 'modal-dialog__slice create-new-space__templates'
          }>
          <TemplatesList
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelect={(template) => onSelect(template)}
            isNewSpacePurchaseFlow={isNewSpacePurchaseFlow}
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
  isNewSpacePurchaseFlow: PropTypes.bool,
};
