export interface MenuItem {
  id: string;
  label: string;
  href?: string | null;
  icon?: string | null;
  permission_code?: string | null;
  children: MenuItem[];
}

export interface MenusResponse {
  success: boolean;
  items: MenuItem[];
}

export interface DashboardResponse {
  success: boolean;
  portal: string;
  widgets: string[];
}

export interface AccessConfigResponse {
  success: boolean;
  portal: string;
  permissions: string[];
  route_permissions: Record<string, string>;
  data_scope: "all" | "vendor_owned" | "customer_owned";
}

export type DataScope = AccessConfigResponse["data_scope"];
