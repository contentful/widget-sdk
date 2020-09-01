import React, { useMemo, useCallback, Fragment } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Heading, TextLink, Paragraph } from '@contentful/forma-36-react-components';
import CreateEntryLinkButton from 'components/CreateEntryButton/CreateEntryLinkButton';
import * as Analytics from 'analytics/Analytics';
import { entitySelector } from 'features/entity-search';
import * as accessChecker from 'access_control/AccessChecker';
import { get, uniq, isObject, extend } from 'lodash';
import { getModule } from 'core/NgRegistry';

const styles = {
  helpText: css({
    marginTop: tokens.spacingM,
    color: tokens.colorTextLightest,
  }),
  heading: css({
    fontSize: tokens.fontSizeS,
    fontWeight: tokens.fontWeightNormal,
    textTransform: 'uppercase',
    color: tokens.colorTextLightest,
    borderBottom: `1px solid ${tokens.colorElementDarkest}`,
    marginTop: tokens.spacingXl,
    lineHeight: 2,
    letterSpacing: '1px',
  }),
};

const linkEntity = (entity) => ({
  sys: {
    id: entity.sys.id,
    linkType: entity.sys.type,
    type: 'Link',
  },
});

export const BulkEditorSidebar = ({ linkCount, field, addLinks, track }) => {
  const spaceContext = useMemo(() => getModule('spaceContext'), []);

  // TODO necessary for entitySelector change it
  const extendedField = useMemo(
    () =>
      extend({}, field, {
        itemLinkType: get(field, ['items', 'linkType']),
        itemValidations: get(field, ['items', 'validations'], []),
      }),
    [field]
  );

  const addNewEntry = useCallback(
    (ctOrCtId) => {
      const contentType = isObject(ctOrCtId) ? ctOrCtId : spaceContext.publishedCTs.get(ctOrCtId);
      return spaceContext.cma.createEntry(contentType.getId(), {}).then((entry) => {
        Analytics.track('entry:create', {
          eventOrigin: 'bulk-editor',
          contentType: contentType.data,
          response: entry.data,
        });
        track.addNew();
        return addLinks([linkEntity(entry)]);
      });
    },
    [spaceContext, addLinks, track]
  );

  const addExistingEntries = useCallback(async () => {
    try {
      const entities = await entitySelector.openFromField(extendedField, linkCount);
      track.addExisting(entities.length);
      addLinks(entities.map(linkEntity));
    } catch (error) {
      // ignore closing of entity selector
    }
  }, [linkCount, extendedField, addLinks, track]);

  const getAllContentTypeIds = useCallback(
    () => spaceContext.publishedCTs.getAllBare().map((ct) => ct.sys.id),
    [spaceContext]
  );

  /**
   * Returns a list of content types that the user can add to this field.
   *
   * This takes into account the content types users can create entries for and
   * the content type validation on the field.
   */
  const getAllowedCTs = useCallback(
    (field) => {
      const itemValidations = get(field, ['items', 'validations']);

      const contentTypeValidation = itemValidations.find(
        (validation) => !!validation.linkContentType
      );

      const validCtIds = contentTypeValidation
        ? contentTypeValidation.linkContentType
        : getAllContentTypeIds();

      const validCTs = uniq(validCtIds).map((ctId) => spaceContext.publishedCTs.get(ctId));

      return validCTs
        .filter((ct) => ct && accessChecker.canPerformActionOnEntryOfType('create', ct.getId()))
        .map((ct) => ct.data);
    },
    [spaceContext, getAllContentTypeIds]
  );

  const allowedCTs = useMemo(() => getAllowedCTs(extendedField), [getAllowedCTs, extendedField]);

  return (
    <Fragment>
      <Heading className={styles.heading} element="h2">
        Entries
      </Heading>
      {linkCount === 1 ? (
        <Paragraph className={styles.helpText}>
          There is 1 linked entry in <em>{field.name}</em>.
        </Paragraph>
      ) : (
        <Paragraph className={styles.helpText}>
          There are {linkCount} linked entries in <em>{field.name}</em>.
        </Paragraph>
      )}
      <CreateEntryLinkButton
        className={styles.helpText}
        hasPlusIcon
        contentTypes={allowedCTs}
        onSelect={addNewEntry}
        text="Create new entry and link"
      />
      <TextLink
        className={styles.helpText}
        testId="add-existing-entry"
        icon="Link"
        onClick={addExistingEntries}>
        Link an existing entry
      </TextLink>
    </Fragment>
  );
};

BulkEditorSidebar.propTypes = {
  linkCount: PropTypes.number.isRequired,
  addLinks: PropTypes.func.isRequired,
  field: PropTypes.object.isRequired,
  track: PropTypes.object.isRequired,
};
