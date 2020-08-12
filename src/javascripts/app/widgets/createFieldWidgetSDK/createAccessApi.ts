import makeExtensionAccessHandlers from 'widgets/bridges/makeExtensionAccessHandlers';

export function createAccessApi() {
  const canAccess = makeExtensionAccessHandlers();

  return {
    can: (action: string, entity: any) => {
      return Promise.resolve(canAccess(action, entity));
    },
  };
}
