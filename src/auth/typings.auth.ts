export interface SignUpTypes {
  name: string;
  username: string;
  email: string;
  password: string;
  role?: string;
}
export interface SignInTypes {
  username: string;
  password: string;
}

export interface OtpTypes {
  username: string;
  otp: string;
}

export interface JwtPayloadType {
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export interface ChangePasswordTypes {
  password: string;
  newPassword: string;
}
