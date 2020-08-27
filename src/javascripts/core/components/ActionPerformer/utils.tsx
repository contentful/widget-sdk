import React from 'react';
import Icon from 'ui/Components/Icon';
import { styles } from './styles';
import { get } from 'lodash';
import { getModule } from 'core/NgRegistry';
import { Tooltip } from '@contentful/forma-36-react-components';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { APP_DEFINITION_TYPE, USER_TYPE } from './constants';
import { WidgetNamespace } from '@contentful/widget-renderer';

export async function getUser(id: string) {
  const spaceContext = getModule('spaceContext');
  const user = await spaceContext.users.get(id);
  if (!user) {
    return '';
  }
  return user;
}

export async function getApp(id: string) {
  const loader = await getCustomWidgetLoader();
  const app = await loader.getOne({ widgetNamespace: WidgetNamespace.APP, widgetId: id });
  if (!app) {
    return '';
  }
  return app;
}

export function formatAppName({ name }: { name: string }) {
  return (
    <div className={styles.wrapper}>
      <Tooltip id={'page-app'} targetWrapperClassName={styles.tooltip} content="Updated by an app">
        <Icon
          name="page-apps"
          scale="0.455"
          className={styles.icon}
          ariaLabel={'App'}
          ariaHideIcon={true}
          ariaDescribedBy={'page-app'}
        />
      </Tooltip>
      {name}
    </div>
  );
}

export function formatUserName(user) {
  if (!user) {
    return '';
  }

  const currentUser = getModule('spaceContext').user;
  if (currentUser && currentUser.sys.id === user.sys.id) {
    return 'Me';
  }

  const { firstName, lastName } = user;
  return `${firstName} ${lastName}`.trim();
}

export function getActionPerformerName(linkType: string, actor) {
  switch (linkType) {
    case APP_DEFINITION_TYPE:
      return formatAppName(actor);
    case USER_TYPE:
    default:
      return formatUserName(actor);
  }
}

export function getActionPerformer(link) {
  const linkType = get(link, ['sys', 'linkType'], USER_TYPE);
  const id = get(link, ['sys', 'id'], '');

  switch (linkType) {
    case APP_DEFINITION_TYPE:
      return getApp(id);
    case USER_TYPE:
    default:
      return getUser(id);
  }
}
