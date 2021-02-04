export type TagOption = {
  value: string;
  label: string;
};

export type TagRecordState = TagOption & { occurrence: number };
export type TagRecordStateWithChangeType = TagRecordState & { changeType: string };
