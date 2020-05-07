import React from 'react';
import Icon from 'ui/Components/Icon';
import { styles } from './styles';
import { get } from 'lodash';
import { getModule } from 'core/NgRegistry';
import { Tooltip } from '@contentful/forma-36-react-components';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { NAMESPACE_APP } from 'widgets/WidgetNamespaces';
import { APP_DEFINITION_TYPE, USER_TYPE } from './constants';

export async function getUser(id: string) {
  const spaceContext = getModule('spaceContext');
  const user = await spaceContext.users.get(id);
  if (!user) {
    return '';
  }
  return user;
}

export async function getApp(id: string) {
  const [app] = await getCustomWidgetLoader().getByKeys([[NAMESPACE_APP, id]]);
  if (!app) {
    return '';
  }
  return app;
}

export function formatAppName({ name }: { name: string }) {
  return (
    <div className={styles.wrapper}>
      <Tooltip content="This modification was done by an app">
        <Icon name="page-apps" scale="0.45" className={styles.icon} />
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
