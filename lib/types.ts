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
}

export interface Attendee {
  id: number;
  name: string;
  email: string;
  pubkey: string | null;
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

// Email campaigns

export type EmailJobStatus = 'pending' | 'running' | 'partial' | 'completed' | 'failed' | 'cancelled';
export type EmailJobSegment = 'checked-in' | 'no-show' | 'waitlist' | 'custom';
export type EmailSendStatus = 'pending' | 'sent' | 'failed' | 'bounced';
export type EmailEventType = 'open' | 'click' | 'bounce' | 'complaint';

export interface EmailJob {
  id: string;
  event_id: string;
  segment: EmailJobSegment;
  template_id: string | null;
  subject: string;
  status: EmailJobStatus;
  total_contacts: number;
  sent_count: number;
  failed_count: number;
  cursor: number;
  errors: Array<{ email: string; error: string; attempts: number; timestamp?: string }>;
  config: Record<string, unknown>;
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_heartbeat: string | null;
  created_at: string;
}

export interface EmailSend {
  id: string;
  job_id: string;
  attendee_id: number;
  email: string;
  status: EmailSendStatus;
  attempts: number;
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface EmailEvent {
  id: string;
  send_id: string | null;
  job_id: string | null;
  attendee_id: number | null;
  event_type: EmailEventType;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Email templates & layouts

export interface EmailLayout {
  id: string;
  name: string;
  description: string | null;
  html_content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  segment: EmailJobSegment;
  subject: string;
  html_content: string;
  text_content: string | null;
  variables: string[];
  layout_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
