export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type AttendeeStatus = 'approved' | 'waitlist' | 'declined';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string;
  location: string | null;
  capacity: number | null;
  status: EventStatus;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventWithCounts extends Event {
  attendee_count: number;
  approved_count: number;
  checked_in_count: number;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  attendee_id: number;
  status: AttendeeStatus;
  checked_in: boolean;
  registered_at: string;
  notes: string | null;
  // joined from attendees table
  name: string;
  email: string;
  pubkey: string | null;
  email_sent: boolean;
  email_type: string | null;
}

export interface Attendee {
  id: number;
  name: string;
  email: string;
  pubkey: string | null;
  email_sent: boolean;
  email_type: string | null;
}

export interface AttendeeWithEvents extends Attendee {
  events: {
    event_id: string;
    event_name: string;
    event_date: string;
    status: AttendeeStatus;
    checked_in: boolean;
    registered_at: string;
  }[];
}

// Email integrations

export type EmailIntegrationType = 'smtp' | 'aws_ses' | 'resend';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from_email: string;
}

export interface AwsSesConfig {
  region: string;
  access_key_id: string;
  secret_access_key: string;
  from_email: string;
}

export interface ResendConfig {
  api_key: string;
  from_email: string;
}

export interface EmailIntegration {
  id: string;
  name: string;
  type: EmailIntegrationType;
  config: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
