/** The authenticated principal attached to every request by the JWT guard. */
export interface AuthUser {
  id: string;
  username: string;
  name: string | null;
  status: string;
  tokenVersion: number;
  mustChangePassword: boolean;
  /** Enabled role ids (the Java `ROLE_` authorities without the prefix). */
  roles: string[];
  /** Permission ids + `type#path[:action]` authority strings. */
  authorities: Set<string>;
  /** Permission ids only, used by the grant guard. */
  permissionIds: Set<string>;
  /** Current access-token id and expiry, used by logout revocation. */
  tokenId?: string;
  tokenExpiresAt?: Date;
}
