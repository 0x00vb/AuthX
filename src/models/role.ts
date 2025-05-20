export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleCreateInput {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface RoleUpdateInput {
  name?: string;
  description?: string;
  permissions?: string[];
} 