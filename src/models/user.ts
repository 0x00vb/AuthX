export interface User {
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
}

export interface UserCreateInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export interface UserUpdateInput {
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
} 