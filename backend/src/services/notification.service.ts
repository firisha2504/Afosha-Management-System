import { OtpChannel, OtpPurpose } from '../types/enums.js';
import prisma from '../config/database.js';
import { config } from '../config/index.js';
import { generateOtp, renderTemplate } from './helpers.js';

export async function createAndSendOtp(
  userId: string,
  purpose: OtpPurpose,
  channel: OtpChannel,
  destination: string
): Promise<void> {
  const code = generateOtp();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + config.otp.expiresMinutes);

  await prisma.otpCode.create({
    data: { userId, code, purpose, channel, expiresAt },
  });

  if (channel === OtpChannel.SMS) {
    await sendSms(destination, `Your AMS verification code is: ${code}. Valid for ${config.otp.expiresMinutes} minutes.`);
  } else {
    await sendEmail(destination, 'AMS Verification Code', `Your verification code is: ${code}`);
  }
}

export async function verifyOtp(
  userId: string,
  code: string,
  purpose: OtpPurpose
): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      userId,
      code,
      purpose,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) return false;

  if (otp.attempts >= config.otp.maxAttempts) return false;

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { isUsed: true },
  });

  return true;
}

export async function sendSms(phone: string, message: string): Promise<boolean> {
  try {
    // Africa's Talking — primary provider
    if (config.africastalking.apiKey) {
      console.log(`[AT] Using key: ${config.africastalking.apiKey?.substring(0, 20)}... username: ${config.africastalking.username}`);
      const { default: AfricasTalking } = await import('africastalking') as { default: (opts: { apiKey: string; username: string }) => { SMS: { send(o: { to: string[]; message: string; from?: string }): Promise<unknown> } } };
      const at = AfricasTalking({
        apiKey: config.africastalking.apiKey,
        username: config.africastalking.username,
      });
      await at.SMS.send({
        to: [phone],
        message,
        ...(config.africastalking.senderId ? { from: config.africastalking.senderId } : {}),
      });
      await prisma.smsLog.create({ data: { phone, message, status: 'sent', provider: 'africastalking' } });
      return true;
    }

    // Twilio — secondary provider
    if (config.twilio.accountSid && config.twilio.authToken) {
      const twilio = await import('twilio');
      const client = twilio.default(config.twilio.accountSid, config.twilio.authToken);
      await client.messages.create({
        body: message,
        from: config.twilio.phoneNumber,
        to: phone,
      });
      await prisma.smsLog.create({ data: { phone, message, status: 'sent', provider: 'twilio' } });
      return true;
    }

    // Development fallback — log to console
    console.log(`[SMS to ${phone}]: ${message}`);
    await prisma.smsLog.create({ data: { phone, message, status: 'logged', provider: 'console' } });
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SMS ERROR to ${phone}]:`, errorMsg);
    await prisma.smsLog.create({
      data: { phone, message, status: 'failed', error: errorMsg },
    });
    return false;
  }
}

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  try {
    if (config.smtp.host && config.smtp.user) {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: false,
        auth: { user: config.smtp.user, pass: config.smtp.pass },
      });
      await transporter.sendMail({ from: config.smtp.from, to, subject, text });
      return true;
    }

    console.log(`[Email to ${to}] ${subject}: ${text}`);
    return true;
  } catch {
    return false;
  }
}

export async function sendPaymentReminderSms(phone: string, amount: number, lang: 'en' | 'om'): Promise<void> {
  const fallback =
    lang === 'om'
      ? `Yaadachiisa: Gumaata tiyya Birr {amount} kaffalamuu qaba. Guyyaa {dueDate} dura kaffali.`
      : `Reminder: Your weekly contribution of Birr {amount} is unpaid. Please pay before {dueDate}.`;

  const setting = await prisma.systemSetting.findUnique({
    where: { key: `sms_template_payment_reminder_${lang}` },
  });

  const template = setting?.value ?? fallback;
  const message = renderTemplate(template, { amount: String(amount) });
  await sendSms(phone, message);
}

export async function sendMeetingReminderSms(phone: string, date: string, lang: 'en' | 'om'): Promise<void> {
  const fallback =
    lang === 'om'
      ? `Yaadachiisa: Walgahiin guyyaa {meetingDate} qophaa'eera. Hirmaachuu siif barbaachisa.`
      : `Reminder: A meeting is scheduled on {meetingDate}. Your attendance is required.`;

  const setting = await prisma.systemSetting.findUnique({
    where: { key: `sms_template_meeting_reminder_${lang}` },
  });

  const template = setting?.value ?? fallback;
  const message = renderTemplate(template, { meetingDate: date });
  await sendSms(phone, message);
}

export async function sendPushNotification(userId: string, title: string, body: string): Promise<void> {
  if (!config.fcm.serverKey) return;

  const tokens = await prisma.deviceToken.findMany({ where: { userId }, select: { token: true } });
  if (!tokens.length) return;

  for (const { token } of tokens) {
    try {
      await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${config.fcm.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          notification: { title, body },
        }),
      });
    } catch {
      // Push delivery is best-effort
    }
  }
}
