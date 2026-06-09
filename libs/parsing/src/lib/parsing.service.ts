import { ParsedEmailData } from './parsing.types';

export interface EmailToParse {
    subject: string;
    fromAddress: string;
    bodyText?: string;
    receivedAt: Date;
}

const PLATFORM_PATTERNS: Record<string, RegExp[]> = {
    Indeed: [/indeed\.com/i, /indeed\.fr/i],
    LinkedIn: [/linkedin\.com/i],
    'Welcome to the Jungle': [/welcometothejungle\.com/i, /wttj\.co/i],
    HelloWork: [/hellowork\.com/i],
    'France Travail': [/francetravail\.fr/i, /pole-emploi\.fr/i],
};

const APPLICATION_SENT_PATTERNS = [
    /candidature.*envoy/i,
    /application.*submitted/i,
    /votre candidature/i,
    /confirmation de candidature/i,
    /thank you for applying/i,
    /we received your application/i,
];

const RECRUITER_REPLY_PATTERNS = [
    /entretien/i,
    /interview/i,
    /nous avons le plaisir/i,
    /suite à votre candidature/i,
    /unfortunately/i,
    /nous ne donnons pas suite/i,
    /offer/i,
    /offre/i,
];

export class ParsingService {
    parse(email: EmailToParse): ParsedEmailData {
        const body = this.cleanBody(email.bodyText ?? '');
        const platform = this.detectPlatform(email.fromAddress, email.subject, body);
        const isApplicationSent = APPLICATION_SENT_PATTERNS.some((p) => p.test(`${email.subject} ${body}`));
        const isRecruiterReply = RECRUITER_REPLY_PATTERNS.some((p) => p.test(`${email.subject} ${body}`));
        const isJobRelated = isApplicationSent || isRecruiterReply || !!platform;

        return {
            platform,
            isJobRelated,
            isApplicationSent,
            isRecruiterReply,
            company: this.extractCompany(email.subject, body),
            jobTitle: this.extractJobTitle(email.subject),
            cleanBody: body,
            receivedAt: email.receivedAt,
        };
    }

    private detectPlatform(from: string, subject: string, body: string): string | undefined {
        const text = `${from} ${subject} ${body}`;
        for (const [name, patterns] of Object.entries(PLATFORM_PATTERNS)) {
            if (patterns.some((p) => p.test(text))) return name;
        }
        return undefined;
    }

    private cleanBody(body: string): string {
        return body
            .replace(/--\s*\n[\s\S]*/m, '')
            .replace(/^\s*>.*$/gm, '')
            .trim();
    }

    private extractCompany(subject: string, body: string): string | undefined {
        const match = subject.match(/(?:chez|at|@)\s+([A-ZÀ-Ü][\w\s&.-]+)/i);
        return match?.[1]?.trim();
    }

    private extractJobTitle(subject: string): string | undefined {
        const cleaned = subject.replace(/^(re:|fwd:)\s*/gi, '').trim();
        return cleaned.length > 3 ? cleaned : undefined;
    }
}
