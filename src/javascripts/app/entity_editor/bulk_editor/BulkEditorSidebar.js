import React, { useMemo, useCallback, Fragment } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Heading, TextLink, Paragraph } from '@contentful/forma-36-react-components';
import CreateEntryLinkButton from 'components/CreateEntryButton/CreateEntryLinkButton';
import * as Analytics from 'analytics/Analytics';
import { entitySelector, useEntitySelectorSdk } from 'features/entity-search';
import * as accessChecker from 'access_control/AccessChecker';
import { get, uniq, isObject, extend } from 'lodash';
import { useSpaceEnvCMAClient } from 'core/services/usePlainCMAClient';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

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
  const { currentSpaceContentTypes } = useSpaceEnvContext();
  const { spaceEnvCMAClient } = useSpaceEnvCMAClient();
  const entitySelectorSdk = useEntitySelectorSdk();

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
      const contentType = isObject(ctOrCtId)
        ? ctOrCtId
        : currentSpaceContentTypes.find((ct) => ct.sys.id === ctOrCtId);

      return spaceEnvCMAClient.entry.create({ contentTypeId: contentType.sys.id }).then((entry) => {
        Analytics.track('entry:create', {
          eventOrigin: 'bulk-editor',
          contentType,
          response: entry,
        });
        track.addNew();
        return addLinks([linkEntity(entry)]);
      });
    },
    [currentSpaceContentTypes, spaceEnvCMAClient, track, addLinks]
  );

  const addExistingEntries = useCallback(async () => {
    try {
      const entities = await entitySelector.openFromField(
        entitySelectorSdk,
        extendedField,
        linkCount
      );
      track.addExisting(entities.length);
      addLinks(entities.map(linkEntity));
    } catch (error) {
      // ignore closing of entity selector
    }
  }, [linkCount, extendedField, addLinks, track, entitySelectorSdk]);

  const getAllContentTypeIds = useCallback(() => currentSpaceContentTypes.map((ct) => ct.sys.id), [
    currentSpaceContentTypes,
  ]);

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

      const validCTs = uniq(validCtIds).map((ctId) =>
        currentSpaceContentTypes.find((ct) => ct.sys.id === ctId)
      );

      return validCTs.filter(
        (ct) => ct && accessChecker.canPerformActionOnEntryOfType('create', ct.sys.id)
      );
    },
    [currentSpaceContentTypes, getAllContentTypeIds]
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
