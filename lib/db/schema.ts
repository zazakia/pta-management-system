// Legacy Drizzle ORM schema replaced with TypeScript types
// This file maintains compatibility while using Supabase under the hood

// Legacy type exports for backward compatibility
export type User = {
  id: string;
  name?: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type NewUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;

export type Team = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeProductId?: string;
  planName?: string;
  subscriptionStatus?: string;
};

export type NewTeam = Omit<Team, 'id' | 'created_at' | 'updated_at'>;

export type TeamMember = {
  id: number;
  userId: string;
  teamId: number;
  role: string;
  joinedAt: string;
};

export type NewTeamMember = Omit<TeamMember, 'id' | 'joinedAt'>;

export type ActivityLog = {
  id: number;
  teamId: number;
  userId?: string;
  action: string;
  timestamp: string;
  ipAddress?: string;
};

export type NewActivityLog = Omit<ActivityLog, 'id' | 'timestamp'>;

export type Invitation = {
  id: number;
  teamId: number;
  email: string;
  role: string;
  invitedBy: string;
  invitedAt: string;
  status: string;
};

export type NewInvitation = Omit<Invitation, 'id' | 'invitedAt'>;

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

// Placeholder table references for backward compatibility
export const users = null;
export const teams = null;
export const teamMembers = null;
export const activityLogs = null;
export const invitations = null;