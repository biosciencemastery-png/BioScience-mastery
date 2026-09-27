import type { Locale } from "@/lib/i18n";
const en = {
  title: "Choose your examination",
  intro:
    "Explore your preparation options. Course information is separate from access to published lessons.",
  coming: "Coming Soon",
  preparing: "In preparation",
  published: "Published",
  explore: "Explore",
  notify: "Notify Me",
  unavailable:
    "The examination catalogue is temporarily unavailable. Please try again later.",
  empty: "No examinations are available yet.",
  noLessons: "Learning content is not available until the course is published.",
  notifyTitle: "Course launch notifications",
  email: "Email address",
  consent:
    "Email me when this course becomes available. I can unsubscribe at any time.",
  submit: "Send confirmation email",
  success:
    "If eligible, a confirmation email will arrive. Please confirm before receiving launch notifications.",
  disabled:
    "Email notifications are not available yet. Please check back later.",
  invalid: "Please check your email, consent and verification, then try again.",
  confirm: "Confirm subscription",
  unsubscribe: "Unsubscribe",
  confirmed: "Your subscription is confirmed.",
  unsubscribed:
    "You are unsubscribed. No further launch notifications will be sent for this subscription.",
  badLink:
    "This link is invalid or expired. Please request a new confirmation email.",
  back: "Back to examinations",
  pending: "Please wait…",
};
const hi: typeof en = {
  title: "अपनी परीक्षा चुनें",
  intro:
    "अपनी तैयारी के विकल्प देखें। पाठ्यक्रम की जानकारी और प्रकाशित पाठों तक पहुँच अलग हैं।",
  coming: "जल्द आ रहा है",
  preparing: "तैयारी जारी है",
  published: "प्रकाशित",
  explore: "जानकारी देखें",
  notify: "मुझे सूचित करें",
  unavailable: "परीक्षा सूची अभी उपलब्ध नहीं है। कृपया बाद में प्रयास करें।",
  empty: "अभी कोई परीक्षा उपलब्ध नहीं है।",
  noLessons: "पाठ्यक्रम प्रकाशित होने तक अध्ययन सामग्री उपलब्ध नहीं है।",
  notifyTitle: "पाठ्यक्रम शुरू होने की सूचनाएँ",
  email: "ईमेल पता",
  consent:
    "यह पाठ्यक्रम उपलब्ध होने पर मुझे ईमेल भेजें। मैं कभी भी सदस्यता समाप्त कर सकता/सकती हूँ।",
  submit: "पुष्टि ईमेल भेजें",
  success:
    "यदि पात्र है, तो पुष्टि ईमेल आएगा। सूचनाएँ पाने से पहले पुष्टि करें।",
  disabled: "ईमेल सूचनाएँ अभी उपलब्ध नहीं हैं। कृपया बाद में देखें।",
  invalid: "ईमेल, सहमति और सत्यापन जाँचकर फिर प्रयास करें।",
  confirm: "सदस्यता की पुष्टि करें",
  unsubscribe: "सदस्यता समाप्त करें",
  confirmed: "आपकी सदस्यता की पुष्टि हो गई है।",
  unsubscribed:
    "सदस्यता समाप्त हो गई है। इस सदस्यता के लिए आगे लॉन्च सूचनाएँ नहीं भेजी जाएँगी।",
  badLink: "लिंक अमान्य है या समाप्त हो गया है। नया पुष्टि ईमेल माँगें।",
  back: "परीक्षा सूची पर वापस जाएँ",
  pending: "कृपया प्रतीक्षा करें…",
};
export const examMessages = (locale: Locale) => (locale === "hi" ? hi : en);
