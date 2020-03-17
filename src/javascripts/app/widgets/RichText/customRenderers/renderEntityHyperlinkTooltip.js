import React from 'react';
import { entityHyperlinkTooltipStyles as styles } from './styles';
import { ScheduleTooltipContent } from 'app/ScheduledActions';
import { EntityStatusTag } from 'components/shared/EntityStatusTag';
import * as EntityState from 'data/CMA/EntityState';
import * as EntityHelpers from 'app/entity_editor/entityHelpers';
import { truncate } from 'utils/StringUtils';

async function fetchAllData({ widgetAPI, entityId, entityType, localeCode }) {
  let contentType;

  const getEntity = entityType === 'Entry' ? widgetAPI.space.getEntry : widgetAPI.space.getAsset;
  const entity = await getEntity(entityId);
  if (entity.sys.contentType) {
    const contentTypeId = entity.sys.contentType.sys.id;
    contentType = await widgetAPI.space.getContentType(contentTypeId);
  }

  const jobs = await widgetAPI.space.getEntityScheduledActions(entityType, entityId);

  const entityHelpers = EntityHelpers.newForLocale(localeCode);

  const [entityTitle, entityDescription] = await Promise.all([
    entityHelpers.entityTitle(entity),
    entityHelpers.entityDescription(entity)
  ]);

  const entityStatus = EntityState.stateName(EntityState.getState(entity.sys));

  return {
    jobs,
    entity,
    entityTitle,
    entityDescription,
    entityStatus,
    contentTypeName: contentType ? contentType.name : ''
  };
}

// eslint-disable-next-line react/prop-types
function renderEntityInfo({ entityTitle, entityStatus, contentTypeName }) {
  const title = truncate(entityTitle, 60) || 'Untitled';
  return (
    <div>
      <span className={styles.entityContentType}>{contentTypeName || 'Asset'}</span>
      <span className={styles.entityTitle}>{title}</span>
      <EntityStatusTag statusLabel={entityStatus} />
    </div>
  );
}

function EntityHyperlinkTooltip(props) {
  const { widgetAPI, logViewportAction } = props.richTextAPI;
  const { target } = props;

  const onEntityFetchComplete = () => logViewportAction('linkRendered', {});

  const [requestStatus, setRequestStatus] = React.useState({ type: 'loading' });

  React.useEffect(() => {
    fetchAllData({
      widgetAPI,
      entityId: target.sys.id,
      entityType: target.sys.linkType,
      localeCode: widgetAPI.field.locale
    })
      .then(entityInfo => {
        setRequestStatus({ type: 'success', data: entityInfo });
      })
      .catch(e => {
        console.log(e);
        setRequestStatus({ type: 'error', error: e });
      });
  }, [target, widgetAPI]);

  if (requestStatus.type === 'loading') {
    return `Loading ${target.sys.linkType.toLowerCase()}...`;
  }
  let tooltip = '';
  if (requestStatus.type === 'error') {
    tooltip = `${target.sys.linkType} missing or inaccessible`;
  } else {
    onEntityFetchComplete && onEntityFetchComplete();
    const { jobs, ...entityInfo } = requestStatus.data;
    tooltip = (
      <>
        {renderEntityInfo(entityInfo)}
        {jobs.length > 0 ? (
          <>
            <hr className={styles.separator} />
            <ScheduleTooltipContent job={jobs[0]} jobsCount={jobs.length} />
          </>
        ) : null}
      </>
    );
  }
  return tooltip;
}

export default function renderEntityHyperlinkTooltip(richTextAPI, target) {
  return <EntityHyperlinkTooltip richTextAPI={richTextAPI} target={target} />;
}
