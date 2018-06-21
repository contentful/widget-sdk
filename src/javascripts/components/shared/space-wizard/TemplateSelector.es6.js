import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {get} from 'lodash';
import spinner from 'ui/Components/Spinner';
import {asReact} from 'ui/Framework/DOMRenderer';

import TemplatesToggle from './TemplatesToggle';
import TemplatesList from './TemplatesList';

const TemplateSelector = createReactClass({
  propTypes: {
    onSelect: PropTypes.func.isRequired,
    fetchTemplates: PropTypes.func.isRequired,
    templates: PropTypes.object.isRequired
  },
  getInitialState () {
    return {
      isShowingTemplates: false,
      selectedTemplate: null
    };
  },

  componentDidMount () {
    const { fetchTemplates } = this.props;

    // Select the first template after loading is finished
    fetchTemplates().then(this.setInitialTemplate);
  },

  render () {
    const { templates } = this.props;
    const {selectedTemplate, isShowingTemplates} = this.state;
    const templatesListClassName = classnames(
      'modal-dialog__slice',
      'create-new-space__templates',
      {
        'open': isShowingTemplates,
        'close': !isShowingTemplates
      }
    );

    const { isPending, error, templatesList } = templates;

    return (
      <div>
        <TemplatesToggle
          isShowingTemplates={isShowingTemplates}
          onChange={this.toggle}
        />
        {
          isPending &&
            <div className={templatesListClassName}>
              <div className="loader__container">
                {asReact(spinner({diameter: '40px'}))}
              </div>
            </div>
        }
        {
          !isPending && !error &&
          <div className={templatesListClassName}>
            <TemplatesList
              templates={templatesList}
              selectedTemplate={selectedTemplate}
              onSelect={this.selectTemplate}
            />
          </div>
        }
        {
          !isPending && error &&
          <div className="note-box--warning">
            <p>Could not fetch space templates.</p>
          </div>
        }
      </div>
    );
  },

  toggle (value) {
    const { onSelect } = this.props;

    this.setState({ isShowingTemplates: value });

    // We set it directly in the parent so that it can persist in local component state
    // for visual representation
    if (value === false) {
      onSelect(null);
    }
  },

  setInitialTemplate () {
    const { templates: { templatesList } } = this.props;
    const { isShowingTemplates } = this.state;
    const template = get(templatesList, '[0]');

    // If we are currently showing the list, "select" it so that the content would
    // be added to the newly created space. Otherwise, just set it as selected visually.
    if (isShowingTemplates) {
      this.selectTemplate(template);
    } else {
      this.setState({ selectedTemplate: template });
    }
  },

  selectTemplate (selectedTemplate) {
    this.props.onSelect(selectedTemplate);

    this.setState({selectedTemplate});
  }
});

export default TemplateSelector;
