type PermissionsType = { manage: boolean; read: boolean };

export type Internal = {
  name?: string;
  description?: string;
  uiCompatible: boolean;
  metadataTagRuleExists: boolean;
  entries: unknown;
  assets: unknown;
  contentDelivery: PermissionsType;
  contentModel: PermissionsType;
  environmentAliases: PermissionsType;
  environments: PermissionsType;
  settings: PermissionsType;
  tags: PermissionsType;
  policyString: string;
};
