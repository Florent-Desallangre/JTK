export const JTK_VERSION = '0.1.0';

export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected' | 'archived';

export type EmailProviderType = 'gmail' | 'outlook';

export type FollowupMode = 'manual' | 'assisted' | 'automatic';

export type EventType =
    | 'email_received'
    | 'application_created'
    | 'application_updated'
    | 'classification_completed'
    | 'followup_due'
    | 'followup_sent'
    | 'notification_sent';
