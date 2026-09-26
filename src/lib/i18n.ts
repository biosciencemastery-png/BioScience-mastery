import en from "@/messages/en.json";
import hi from "@/messages/hi.json";

export const locales = ["en", "hi"] as const;
export type Locale = (typeof locales)[number];
export type Messages = typeof en;
export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
export function getMessages(locale: Locale): Messages {
  return locale === "hi" ? hi : en;
}
