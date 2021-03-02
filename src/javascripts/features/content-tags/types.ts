export type TagVisibilityType = 'private' | 'public';
export type TagVisibilityOption = 'private' | 'public' | 'any';

export type TagOption = {
  value: string;
  label: string;
  visibility: TagVisibilityType;
};

export type TagSearchOption = Pick<TagOption, Exclude<keyof TagOption, 'visibility'>>;

export type TagRecordState = TagOption & { occurrence: number };
export type TagRecordStateWithChangeType = TagRecordState & { changeType: string };
