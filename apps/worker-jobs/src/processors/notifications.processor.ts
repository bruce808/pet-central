import { Worker, Job } from 'bullmq';
import type Redis from 'ioredis';

interface EmailJobData {
  to: string;
  subject: string;
  bodyTemplate: string;
  variables?: Record<string, string>;
}

interface SmsJobData {
  to: string;
  message: string;
}

interface InAppJobData {
  userId: string;
  title: string;
  body: string;
  actionUrl?: string;
}

type NotificationJobData = EmailJobData | SmsJobData | InAppJobData;
type NotificationJobName = 'send-email' | 'send-sms' | 'send-in-app';

export function createNotificationsWorker(connection: Redis): Worker<NotificationJobData, void, NotificationJobName> {
  return new Worker<NotificationJobData, void, NotificationJobName>(
    'notifications',
    async (job: Job<NotificationJobData, void, NotificationJobName>) => {
      try {
        switch (job.name) {
          case 'send-email':
            await sendEmail(job.data as EmailJobData);
            break;
          case 'send-sms':
            await sendSms(job.data as SmsJobData);
            break;
          case 'send-in-app':
            await sendInApp(job.data as InAppJobData);
            break;
          default:
            console.warn(`[notifications] Unknown job name: ${job.name}`);
        }
      } catch (error) {
        console.error(
          `[notifications] Job ${job.name} failed:`,
          error,
        );
        throw error;
      }
    },
    { connection, concurrency: 10 },
  );
}

async function sendEmail(data: EmailJobData): Promise<void> {
  // TODO: integrate SMTP provider (e.g. SES, Postmark) for production
  console.log(
    `[notifications:email] To: ${data.to} | Subject: ${data.subject} | Template: ${data.bodyTemplate}`,
  );
  if (data.variables) {
    console.log(
      `[notifications:email] Variables: ${JSON.stringify(data.variables)}`,
    );
  }
}

async function sendSms(data: SmsJobData): Promise<void> {
  // TODO: integrate Twilio or similar for production
  console.log(
    `[notifications:sms] To: ${data.to} | Message: ${data.message.substring(0, 80)}${data.message.length > 80 ? '...' : ''}`,
  );
}

async function sendInApp(data: InAppJobData): Promise<void> {
  // TODO: persist to notification table and push via WebSocket
  console.log(
    `[notifications:in-app] User: ${data.userId} | Title: ${data.title} | Body: ${data.body.substring(0, 80)}${data.body.length > 80 ? '...' : ''}`,
  );
  if (data.actionUrl) {
    console.log(`[notifications:in-app] Action URL: ${data.actionUrl}`);
  }
}
