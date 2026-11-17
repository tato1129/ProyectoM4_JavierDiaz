import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import type { SendEmailParams } from '../types';

type Env = Record<string, string | undefined>;

/**
 * Crea la función que envía emails con AWS SES. Las credenciales se leen de variables
 * de entorno en el momento del envío (nunca llegan al frontend) y el cliente se cachea.
 */
export function createSesSender(env: Env = process.env): (params: SendEmailParams) => Promise<void> {
  let client: SESClient | null = null;

  return async ({ to, subject, text, html }) => {
    const region = env.SES_AWS_REGION;
    const accessKeyId = env.SES_AWS_ACCESS_KEY_ID;
    const secretAccessKey = env.SES_AWS_SECRET_ACCESS_KEY;
    const source = env.SES_FROM_EMAIL;

    if (!region || !accessKeyId || !secretAccessKey || !source) {
      throw new Error(
        'Faltan variables de entorno de AWS SES (SES_AWS_REGION, SES_AWS_ACCESS_KEY_ID, SES_AWS_SECRET_ACCESS_KEY, SES_FROM_EMAIL).',
      );
    }

    client ??= new SESClient({ region, credentials: { accessKeyId, secretAccessKey } });

    await client.send(
      new SendEmailCommand({
        Source: source,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: text, Charset: 'UTF-8' },
            Html: { Data: html, Charset: 'UTF-8' },
          },
        },
      }),
    );
  };
}
