export interface FlowUsLimbicSettings {
  clientId: string;
  clientSecret: string;
  databaseId: string;
  tableName: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

export const DEFAULT_SETTINGS: FlowUsLimbicSettings = {
  clientId: '',
  clientSecret: '',
  databaseId: '',
  tableName: '',
  accessToken: '',
  refreshToken: '',
  tokenExpiry: 0
};