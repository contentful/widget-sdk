import React from 'react';
import PropTypes from 'prop-types';
import { Heading, Paragraph, SelectField, Option } from '@contentful/forma-36-react-components';

Projects.propTypes = {
  allProjects: PropTypes.array.isRequired,
  selectedProject: PropTypes.string.isRequired,
  onProjectChange: PropTypes.func.isRequired
};

export default function Projects({ allProjects, selectedProject, onProjectChange }) {
  return (
    <div className="f36-margin-top--xl">
      <Heading>Optimizely Project</Heading>
      <Paragraph className="f36-margin-top--m">
        Works only with Optimizely Full Stack projects
      </Paragraph>
      <SelectField
        className="f36-margin-top--m"
        id="project"
        labelText="Project"
        required={true}
        value={selectedProject}
        onChange={onProjectChange}
        selectProps={{ value: selectedProject, isDisabled: !allProjects }}
        width="large">
        <Option>Select Optimizely Project</Option>
        {allProjects &&
          allProjects.map(p => (
            <Option key={p.id} value={p.id}>
              {p.name}
            </Option>
          ))}
      </SelectField>
    </div>
  );
}
