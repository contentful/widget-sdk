import React from 'react';
import PropTypes from 'prop-types';

import { get } from 'lodash';
import { css } from 'emotion';
import cn from 'classnames';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  navItem: css({
    backgroundColor: tokens.colorElementLight,
    border: `1px solid ${tokens.colorElementDark}`,
    borderTopLeftRadius: '3px',
    borderTopRightRadius: '3px',
  }),
  selectedTemplateContainer: css({
    borderLeft: `1px solid ${tokens.colorElementDark}`,
    borderRight: `1px solid ${tokens.colorElementDark}`,
    borderBottom: `1px solid ${tokens.colorElementDark}`,
  }),
  removeBorder: css({
    borderLeft: 'none',
  }),
  container: css({
    marginBottom: tokens.spacingL,
  }),
};

export default function TemplatesList(props) {
  const { templates, selectedTemplate, onSelect, isNewSpacePurchaseFlow } = props;

  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <div
      data-test-id="template-list-wrapper"
      className={isNewSpacePurchaseFlow ? styles.container : 'create-new-space__templates__inner'}>
      <div
        className={cn('create-new-space__templates__nav', {
          [styles.removeBorder]: isNewSpacePurchaseFlow,
        })}>
        {templates.map((template) => {
          const isSelected = get(selectedTemplate, 'sys.id') === get(template, 'sys.id');
          return (
            <div
              key={get(template, 'sys.id')}
              className={cn('create-new-space__templates__navitem', {
                ['selected']: isSelected,
                [styles.navItem]: isNewSpacePurchaseFlow,
              })}
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
          className={cn('create-new-space__templates__description', {
            [styles.selectedTemplateContainer]: isNewSpacePurchaseFlow,
          })}>
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
  isNewSpacePurchaseFlow: PropTypes.bool,
};
