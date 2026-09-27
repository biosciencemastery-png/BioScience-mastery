import type { Locale } from "@/lib/i18n";
const en = {
  login: "Welcome back",
  register: "Create your account",
  forgot: "Reset your password",
  reset: "Choose a new password",
  account: "Your account",
  confirm: "Confirm your email link",
  email: "Email address",
  password: "Password",
  newPassword: "New password",
  displayName: "Display name",
  language: "Preferred language",
  currentPassword: "Confirm your password",
  signIn: "Sign in",
  signUp: "Create account",
  sendReset: "Send reset link",
  updatePassword: "Update password",
  save: "Save profile",
  signOut: "Sign out",
  requestDeletion: "Request account deletion",
  confirmButton: "Continue securely",
  pending: "Please wait…",
  passwordHelp: "Use 12–128 characters. Never reuse an important password.",
  forgotLink: "Forgot password?",
  registerLink: "Create an account",
  loginLink: "Return to sign in",
  home: "Back to homepage",
  setup:
    "Account access is not available yet. Please return after setup is complete.",
  accountIntro:
    "Manage your profile and account access. Learning and enrollment will be added in a later release.",
  confirmHelp:
    "Continue to verify this one-time email link. Opening this page alone does not use the link.",
  deletionHelp:
    "This submits a request for review; it does not immediately delete your account. Confirm your password and acknowledgement below.",
  deletionConsent: "I want to request deletion of my account.",
  reminders:
    "Allow optional examination reminders when that service becomes available.",
  requestStatus: "Deletion request status",
  profileUnavailable:
    "Your profile could not be loaded. Please try again later.",
  errors: {
    invalid: "Please check the information you entered.",
    failed: "We could not complete that request. Please try again later.",
    credentials:
      "Sign-in failed. Check your email and password, and confirm your email first.",
    setup: "Account access is not available yet.",
    link: "This link is invalid or expired. Request a new email link.",
    confirmation:
      "Email confirmation must be enabled before registrations can open.",
    password: "Password confirmation failed. Please try again.",
  },
  success: {
    registered:
      "If registration can proceed, a confirmation link will be sent. Check your inbox before signing in.",
    resetSent:
      "If an account exists for this email, a reset link will be sent. Check your inbox.",
    passwordUpdated: "Password updated. Please sign in again.",
    profileSaved: "Your profile was saved.",
    deletionRequested: "Your deletion request has been recorded for review.",
    verified: "Email confirmed. You can now access your account.",
  },
};
const hi: typeof en = {
  login: "फिर से स्वागत है",
  register: "अपना खाता बनाएँ",
  forgot: "पासवर्ड रीसेट करें",
  reset: "नया पासवर्ड चुनें",
  account: "आपका खाता",
  confirm: "ईमेल लिंक की पुष्टि करें",
  email: "ईमेल पता",
  password: "पासवर्ड",
  newPassword: "नया पासवर्ड",
  displayName: "प्रदर्शित नाम",
  language: "पसंदीदा भाषा",
  currentPassword: "अपने पासवर्ड की पुष्टि करें",
  signIn: "साइन इन करें",
  signUp: "खाता बनाएँ",
  sendReset: "रीसेट लिंक भेजें",
  updatePassword: "पासवर्ड बदलें",
  save: "प्रोफ़ाइल सहेजें",
  signOut: "साइन आउट करें",
  requestDeletion: "खाता हटाने का अनुरोध करें",
  confirmButton: "सुरक्षित रूप से आगे बढ़ें",
  pending: "कृपया प्रतीक्षा करें…",
  passwordHelp:
    "12–128 अक्षरों का उपयोग करें। किसी महत्वपूर्ण पासवर्ड का दोबारा उपयोग न करें।",
  forgotLink: "पासवर्ड भूल गए?",
  registerLink: "नया खाता बनाएँ",
  loginLink: "साइन इन पर लौटें",
  home: "मुखपृष्ठ पर लौटें",
  setup: "खाते की सुविधा अभी उपलब्ध नहीं है। सेटअप पूरा होने के बाद वापस आएँ।",
  accountIntro:
    "अपनी प्रोफ़ाइल और खाते का प्रबंधन करें। पढ़ाई और नामांकन अगले संस्करण में जोड़े जाएँगे।",
  confirmHelp:
    "इस एक बार उपयोग होने वाले ईमेल लिंक की पुष्टि के लिए आगे बढ़ें। केवल यह पृष्ठ खोलने से लिंक उपयोग नहीं होता।",
  deletionHelp:
    "यह समीक्षा के लिए अनुरोध भेजता है; आपका खाता तुरंत नहीं हटता। नीचे पासवर्ड और सहमति की पुष्टि करें।",
  deletionConsent: "मैं अपना खाता हटाने का अनुरोध करना चाहता/चाहती हूँ।",
  reminders: "सेवा उपलब्ध होने पर वैकल्पिक परीक्षा अनुस्मारक प्राप्त करें।",
  requestStatus: "खाता हटाने के अनुरोध की स्थिति",
  profileUnavailable:
    "प्रोफ़ाइल लोड नहीं हो सकी। कृपया बाद में फिर प्रयास करें।",
  errors: {
    invalid: "कृपया भरी गई जानकारी जाँचें।",
    failed: "यह अनुरोध पूरा नहीं हो सका। कृपया बाद में प्रयास करें।",
    credentials:
      "साइन इन नहीं हुआ। ईमेल और पासवर्ड जाँचें और पहले ईमेल की पुष्टि करें।",
    setup: "खाते की सुविधा अभी उपलब्ध नहीं है।",
    link: "लिंक अमान्य है या उसकी अवधि समाप्त हो गई है। नया ईमेल लिंक माँगें।",
    confirmation: "पंजीकरण शुरू होने से पहले ईमेल पुष्टि सक्रिय होनी चाहिए।",
    password: "पासवर्ड की पुष्टि नहीं हुई। फिर प्रयास करें।",
  },
  success: {
    registered:
      "यदि पंजीकरण संभव है, तो पुष्टि लिंक भेजा जाएगा। साइन इन करने से पहले अपना इनबॉक्स जाँचें।",
    resetSent:
      "यदि इस ईमेल से खाता जुड़ा है, तो रीसेट लिंक भेजा जाएगा। अपना इनबॉक्स जाँचें।",
    passwordUpdated: "पासवर्ड बदल गया है। फिर से साइन इन करें।",
    profileSaved: "प्रोफ़ाइल सहेज दी गई है।",
    deletionRequested:
      "खाता हटाने का अनुरोध समीक्षा के लिए दर्ज कर लिया गया है।",
    verified: "ईमेल की पुष्टि हो गई है। अब अपना खाता खोल सकते हैं।",
  },
};
export function authMessages(locale: Locale) {
  return locale === "hi" ? hi : en;
}
export type AuthMessages = typeof en;
