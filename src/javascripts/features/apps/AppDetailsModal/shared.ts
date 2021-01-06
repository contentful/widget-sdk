export interface SpaceInformation {
  spaceId: string;
  spaceName: string;
  envName?: string;
  envIsMaster?: boolean;
  envMeta: {
    environmentId: string;
    isMasterEnvironment: boolean;
    aliasId?: string;
  };
}

export const externalLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
};
