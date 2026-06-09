export interface ParsedEmailData {
    platform?: string;
    isJobRelated: boolean;
    isApplicationSent: boolean;
    isRecruiterReply: boolean;
    company?: string;
    jobTitle?: string;
    cleanBody: string;
    receivedAt: Date;
}
