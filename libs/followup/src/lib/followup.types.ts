export type FollowupStatus = 'pending' | 'approved' | 'sent' | 'rejected';

export interface FollowupSuggestion {
    id: string;
    applicationId: string;
    userId: string;
    subject: string;
    body: string;
    status: FollowupStatus;
    createdAt: Date;
}
