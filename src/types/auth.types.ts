export type SessionStatus = 'PENDING_SETUP' | 'PENDING_2FA' | 'AUTHENTICATED';

export interface LoginStatus {
  sessionStatus: SessionStatus;
}

export interface TotpSetup {
  qrUri: string;
  secret: string;
}

export interface AuthenticatedUser {
  userId: number;
  username: string;
}
