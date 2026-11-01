export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number; // seconds
}

export interface ValidationIssue {
  loc: (string | number)[];
  msg: string;
  type: string;
}
