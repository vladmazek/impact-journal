export type SettingsActionState = {
  error: string | null;
  success: string | null;
};

export const initialSettingsActionState: SettingsActionState = {
  error: null,
  success: null,
};
