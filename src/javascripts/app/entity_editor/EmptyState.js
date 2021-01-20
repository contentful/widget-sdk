import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import Loader from 'ui/Loader';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  wrapper: css({ height: '100%' }),
  emptyState: css({
    alignteIms: 'center',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 18px)',
    justifyContent: 'center',
    margin: 'auto',
    textAlign: 'center',
  }),
  emptyStateTitle: css({
    color: tokens.colorTextDark,
    fontSize: tokens.fontSize2Xl,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: 1.2,
    marginTop: tokens.spacingL,
  }),
  emptyStateDescription: css({
    color: tokens.colorTextBase,
    fontSize: tokens.fontSizeXl,
    lineHeight: 1.5,
    margin: '20px auto 0',
    maxWidth: '720px',
  }),
};

const ASSET = 'Asset';
const ENTRY = 'Entry';
const BULK_EDITOR = 'BulkEditor';

export const EmptyState = ({ slideState }) => {
  const { slide, loadingError } = slideState;

  let entityType = ENTRY;
  if (slide.type === ASSET) {
    entityType = slide.type;
  }
  const lowerEntityType = entityType.toLowerCase();

  return (
    <div className={styles.wrapper}>
      {!loadingError ? (
        <Loader testId="emptystate-loader" isShown />
      ) : (
        <div className={styles.emptyState} data-test-id="emptystate-error">
          {loadingError.statusCode === 404 ? (
            <div className={styles.emptyStateTitle}>{entityType} missing or inaccessible</div>
          ) : (
            <Fragment>
              <div className={styles.emptyStateTitle}>
                Error loading {lowerEntityType} with id&#32;
                <code>{slide.type === BULK_EDITOR ? slide.path[0] : slide.id}</code>
              </div>
              <div className={styles.emptyStateDescription}>
                {loadingError.body?.message || loadingError.message}
              </div>
            </Fragment>
          )}
        </div>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  slideState: PropTypes.shape({
    slide: PropTypes.oneOfType([
      PropTypes.shape({
        type: PropTypes.oneOf([ASSET, ENTRY]).isRequired,
        id: PropTypes.string,
      }),
      PropTypes.shape({
        type: PropTypes.oneOf([BULK_EDITOR]).isRequired,
        path: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
      }),
    ]).isRequired,
    loadingError: PropTypes.shape({
      statusCode: PropTypes.number,
      message: PropTypes.string,
      body: PropTypes.shape({
        message: PropTypes.string,
      }),
    }),
  }).isRequired,
};
