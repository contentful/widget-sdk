import React from 'react';
import PropTypes from 'prop-types';
import { isEqual, get } from 'lodash';
import { css } from 'emotion';

import SnapshotPresenterWidgets from './SnapshotPresenterWidgets';
import tokens from '@contentful/forma-36-tokens';
import { getFieldPath } from './utils';

const styles = {
  root: css({
    fontSize: tokens.fontSizeL,
  }),
};

const isEmpty = (v) => {
  return v === null || v === undefined || v === '' || isEqual(v, []) || isEqual(v, {});
};

const referenceOr = (type, alt) => {
  return type === 'Link' ? 'Reference' : alt || type;
};

const getFieldType = ({ type, items }) => {
  if (type === 'Array') {
    const itemsType = items.type;
    return referenceOr(itemsType, `Array<${itemsType}>`);
  } else {
    return referenceOr(type);
  }
};

const SnapshotPresenter = ({ widget, locale, editorData, entity }) => {
  const { field } = widget;

  const type = getFieldType(field);
  const linkType = get(field, 'linkType', get(field, 'items.linkType'));
  const value = get(entity, getFieldPath(field.id, locale.internal_code));

  const hasValue = !isEmpty(value);
  return (
    <div className={styles.root} data-test-id="snapshot-presenter">
      {hasValue && (
        <SnapshotPresenterWidgets
          editorData={editorData}
          entity={entity}
          linkType={linkType}
          locale={locale}
          type={type}
          value={value}
          widget={widget}
        />
      )}
    </div>
  );
};

SnapshotPresenter.propTypes = {
  editorData: PropTypes.object.isRequired,
  entity: PropTypes.object.isRequired,
  widget: PropTypes.shape({
    field: PropTypes.oneOfType([
      PropTypes.shape({
        id: PropTypes.string,
        type: PropTypes.string,
        linkType: PropTypes.string,
      }),
      PropTypes.shape({
        id: PropTypes.string,
        type: PropTypes.string,
        items: PropTypes.shape({
          type: PropTypes.string,
          linkType: PropTypes.string,
        }),
      }),
    ]),
  }).isRequired,
  locale: PropTypes.shape({
    code: PropTypes.string,
    internal_code: PropTypes.string,
  }).isRequired,
};

export default SnapshotPresenter;
