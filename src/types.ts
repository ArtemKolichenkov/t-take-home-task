export interface AppSuccessResponse<T> {
  status: "success";
  data?: T;
}

export interface AppFailedResponse {
  status: "error";
  message: string;
}

export interface PaginatedResponse<T> extends AppSuccessResponse<T> {
  cursor?: string;
  pageSize: number;
}
