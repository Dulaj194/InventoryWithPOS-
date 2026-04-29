export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface TenantFeatureFlags {
  enableInventory: boolean;
  enablePos: boolean;
  enableReports: boolean;
  enableAccounting: boolean;
  enableKds: boolean;
}
