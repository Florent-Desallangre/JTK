import { z } from 'zod';

export const ClassificationSchema = z.object({
    type: z.enum(['positive', 'negative', 'neutral', 'unknown']),
    confidence: z.number().min(0).max(1),
    summary: z.string(),
    next_action: z.enum(['none', 'followup', 'interview', 'reject']),
});

export type ClassificationResult = z.infer<typeof ClassificationSchema>;

export const FollowupEmailSchema = z.object({
    subject: z.string(),
    body: z.string(),
});

export type FollowupEmailResult = z.infer<typeof FollowupEmailSchema>;
