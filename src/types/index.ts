export interface User {
  id: number;
  email: string | null;
  username: string | null;
  password_hash: string | null;
  name: string;
  avatar: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OAuthAccount {
  id: number;
  user_id: number;
  provider: 'google' | 'wechat' | 'wechat_miniapp';
  provider_id: string;
  created_at: Date;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
  created_at: Date;
}

export interface JwtPayload {
  userId: number;
  username: string | null;
  email: string | null;
  name: string;
  avatar: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface CreateUserInput {
  email?: string;
  username?: string;
  password_hash?: string;
  name: string;
  avatar?: string;
}

export interface OAuthProfile {
  providerId: string;
  name: string;
  email?: string;
  avatar?: string;
}
