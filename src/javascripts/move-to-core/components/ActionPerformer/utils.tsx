import React from 'react';
import Icon from 'ui/Components/Icon';
import { styles } from './styles';
import { getModule } from 'core/NgRegistry';
import { Tooltip } from '@contentful/forma-36-react-components';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { NAMESPACE_APP } from 'widgets/WidgetNamespaces';
import { APP_DEFINITION_TYPE, USER_TYPE } from './constants';

export async function getUser(id: string) {
  const spaceContext = getModule('spaceContext');
  return await spaceContext.users.get(id);
}

export async function getApp(id: string) {
  const [app] = await getCustomWidgetLoader().getByKeys([[NAMESPACE_APP, id]]);
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
  if (linkType === 'User') {
    return formatUserName(actor);
  }
  return formatAppName(actor);
}

export function getActionPerformer({ sys: { linkType, id } }) {
  switch (linkType) {
    case APP_DEFINITION_TYPE:
      return getApp(id);
    case USER_TYPE:
    default:
      return getUser(id);
  }
}
