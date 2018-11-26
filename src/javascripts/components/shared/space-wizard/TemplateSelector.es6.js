import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { get } from 'lodash';
import { Spinner } from '@contentful/ui-component-library';

import TemplatesToggle from './TemplatesToggle.es6';
import TemplatesList from './TemplatesList.es6';

class TemplateSelector extends React.Component {
  static propTypes = {
    onSelect: PropTypes.func.isRequired,
    onToggle: PropTypes.func,
    fetchTemplates: PropTypes.func.isRequired,
    templates: PropTypes.object.isRequired,
    formAlign: PropTypes.oneOf(['left', 'center'])
  };

  state = {
    isShowingTemplates: false,
    selectedTemplate: null
  };

  componentDidMount() {
    const { fetchTemplates } = this.props;

    // Select the first template after loading is finished
    fetchTemplates().then(this.setInitialTemplate.bind(this));
  }

  render() {
    const { templates, formAlign } = this.props;
    const { selectedTemplate, isShowingTemplates } = this.state;
    const templatesListClassName = classnames(
      'modal-dialog__slice',
      'create-new-space__templates',
      {
        open: isShowingTemplates,
        close: !isShowingTemplates
      }
    );

    const { isPending, error, templatesList } = templates;

    return (
      <div>
        <TemplatesToggle
          isShowingTemplates={isShowingTemplates}
          onChange={val => this.toggle(val)}
          formAlign={formAlign}
        />
        {isPending && (
          <div className={templatesListClassName}>
            <div className="loader__container">
              <Spinner size="large" />
            </div>
          </div>
        )}
        {!isPending && !error && (
          <div className={templatesListClassName}>
            <TemplatesList
              templates={templatesList}
              selectedTemplate={selectedTemplate}
              onSelect={template => this.selectTemplate(template)}
            />
          </div>
        )}
        {!isPending && error && (
          <div className="note-box--warning">
            <p>Could not fetch space templates.</p>
          </div>
        )}
      </div>
    );
  }

  toggle(value) {
    const { onSelect, onToggle } = this.props;
    const { selectedTemplate } = this.state;

    this.setState(
      () => ({ isShowingTemplates: value }),
      () => {
        onToggle && onToggle();
      }
    );

    // We set it directly in the parent so that it can persist in local component state
    // for visual representation
    if (value === false) {
      onSelect(null);
    } else {
      onSelect(selectedTemplate);
    }
  }

  setInitialTemplate() {
    const {
      templates: { templatesList }
    } = this.props;
    const { isShowingTemplates } = this.state;
    const template = get(templatesList, '[0]');

    // If we are currently showing the list, "select" it so that the content would
    // be added to the newly created space. Otherwise, just set it as selected visually.
    if (isShowingTemplates) {
      this.selectTemplate(template);
    } else {
      this.setState({ selectedTemplate: template });
    }
  }

  selectTemplate(selectedTemplate) {
    this.props.onSelect(selectedTemplate);

    this.setState({ selectedTemplate });
  }
}

export default TemplateSelector;
