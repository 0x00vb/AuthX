export interface UserExtensionField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required?: boolean;
  defaultValue?: any;
  roles?: string[]; // If defined, this field only applies to users with these roles
}

export interface UserExtensionConfig {
  fields: UserExtensionField[];
}

export interface CustomUserFields {
  [key: string]: any;
}

export interface User<T extends CustomUserFields = {}> {
  id: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  isActive: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Custom fields will be typed according to T
  custom?: T;
}

export interface UserCreateInput<T extends CustomUserFields = {}> {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  custom?: T;
}

export interface UserUpdateInput<T extends CustomUserFields = {}> {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  isActive?: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
  custom?: Partial<T>;
} 