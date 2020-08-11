import { useAsyncFn } from 'core/hooks';
import { authUrl } from 'Config';
import { useCallback, useRef } from 'react';

export function useSsoConnectionTest(orgId) {
  const windowRef = useRef();
  const timerRef = useRef();

  const testFn = useCallback(() => {
    const testConnectionUrl = authUrl(`sso/${orgId}/test_connection`);
    // open IdP page in a separate window and serve its reference
    windowRef.current = window.open(
      testConnectionUrl,
      '',
      'toolbar=0,status=0,width=650,height=800,left=250,top=200'
    );

    // return a promise that is resolved once the window is closed
    return new Promise((resolve) => {
      timerRef.current = window.setInterval(() => {
        if (windowRef.current.closed) {
          window.clearInterval(timerRef.current);
          resolve();
        }
      }, 250);
    });
  }, [orgId]);

  const [state, runTest, reset] = useAsyncFn(testFn);

  const cancel = () => {
    windowRef.current.close();
    window.clearInterval(timerRef.current);
    reset();
  };

  return [state, runTest, cancel];
}
