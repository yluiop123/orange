export type PageResult<T> = {
  total: number;
  list: T[];
  page?: number;
  size?: number;
  totalPages?: number;
};

export type ApiMessage = {
  code: number;
  message: string;
  data?: string | null;
};
