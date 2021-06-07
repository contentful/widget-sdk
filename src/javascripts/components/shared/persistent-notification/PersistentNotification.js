import React, { useEffect, useState } from 'react';
import { NotificationBar } from './NotificationBar';
import { emitter } from './service';

export function PersistentNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [data, setData] = useState({});

  useEffect(() => {
    function setNotification(event) {
      if (!event?.message) {
        resetNotification();
        return;
      }

      setData({
        contents: event.message,
        linkUrl: event.link?.href,
        linkText: event.link?.text,
        actionMessage: event.actionMessage,
        onClickAction: event.action,
      });
      setShowNotification(true);
    }

    function resetNotification() {
      setShowNotification(false);
      setData({});
    }

    emitter.on('show', setNotification);
    emitter.on('hide', resetNotification);

    return () => {
      emitter.off('show', setNotification);
      emitter.off('hide', resetNotification);
    };
  }, []);

  if (!showNotification) {
    return null;
  }

  return <NotificationBar {...data} />;
}
