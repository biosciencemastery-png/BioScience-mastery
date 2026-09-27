import { z } from "zod";
import type { Locale } from "@/lib/i18n";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const emailPayload = z.object({
  to: z.string().email(),
  subject: z.string().max(200),
  html: z.string().max(16000),
  text: z.string().max(8000),
  unsubscribe: z.string().url(),
});
export type EmailPayload = z.infer<typeof emailPayload>;
export function notificationEmail({
  locale,
  to,
  course,
  confirm,
  unsubscribe,
  information,
}: {
  locale: Locale;
  to: string;
  course: string;
  confirm?: string;
  unsubscribe: string;
  information: string;
}): EmailPayload {
  const hi = locale === "hi";
  const subject = confirm
    ? hi
      ? "अपनी लॉन्च सूचना सदस्यता की पुष्टि करें"
      : "Confirm your course launch subscription"
    : hi
      ? "आपका पाठ्यक्रम अब उपलब्ध है"
      : "Your course is now available";
  const message = confirm
    ? hi
      ? `${course} की लॉन्च सूचना के लिए पुष्टि करें। लिंक 24 घंटे तक मान्य है। यदि आपने अनुरोध नहीं किया, तो इसे अनदेखा करें या सदस्यता समाप्त करें।`
      : `Confirm your launch notification for ${course}. This link expires in 24 hours. If you did not request this, ignore this message or unsubscribe.`
    : hi
      ? `${course} प्रकाशित हो गया है। पाठ्यक्रम की जानकारी देखें।`
      : `${course} has been published. View the course information.`;
  const action = confirm
    ? hi
      ? "सदस्यता की पुष्टि करें"
      : "Confirm subscription"
    : hi
      ? "जानकारी देखें"
      : "View information";
  const stop = hi ? "सदस्यता समाप्त करें" : "Unsubscribe";
  const url = confirm ?? information;
  return {
    to,
    subject,
    text: `BioScience Mastery\n\n${message}\n\n${action}: ${url}\n${stop}: ${unsubscribe}`,
    html: `<html lang="${locale}"><body><h1>BioScience Mastery</h1><p>${escape(message)}</p><p><a href="${escape(url)}">${action}</a></p><p><a href="${escape(unsubscribe)}">${stop}</a></p></body></html>`,
    unsubscribe,
  };
}
export async function sendNotification(
  payload: EmailPayload,
  options: {
    enabled: boolean;
    apiKey: string;
    from: string;
    jobId: string;
    fetcher?: typeof fetch;
  },
) {
  if (!options.enabled) throw new Error("Email delivery is disabled");
  const valid = emailPayload.parse(payload);
  const response = await (options.fetcher ?? fetch)(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": options.jobId,
      },
      body: JSON.stringify({
        from: options.from,
        to: [valid.to],
        subject: valid.subject,
        html: valid.html,
        text: valid.text,
      }),
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw new Error("Email delivery failed");
}
