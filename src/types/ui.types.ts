export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SortState {
  field: string;
  direction: "asc" | "desc";
}

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface MediaItem {
  url: string;
  type: "image" | "video";
  alt?: string;
  publicId?: string;
}
