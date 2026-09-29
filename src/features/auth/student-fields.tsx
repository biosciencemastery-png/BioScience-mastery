import type { Locale } from "@/lib/i18n";
import type { ExamRecord } from "@/features/exams/catalogue";
export const studentLabels = {
  en: {
    personal: "Personal details",
    academic: "Academic details (optional)",
    goals: "Examinations and consent",
    name: "Full name",
    confirm: "Confirm password",
    phone: "Mobile number (optional, not verified)",
    gender: "Gender (optional)",
    gender_description: "Self-description",
    qualification: "Qualification",
    specialization: "Specialization",
    academic_status: "Current academic status",
    academic_year: "Academic year",
    exams: "My examinations *",
    year: "Target examination year (optional)",
    marketing: "I would like optional marketing and course notifications.",
    next: "Next",
    back: "Back",
    submit: "Create account",
    closed:
      "Registration is closed pending policy review and Development configuration. You can review the steps, but no account will be created.",
    invalid: "Please complete the required fields and check your entries.",
    mismatch: "The passwords do not match.",
    terms: "I agree to the Terms & Conditions.",
    privacy: "I acknowledge the Privacy Policy.",
    unavailable:
      "The examination catalogue is unavailable. No exam goals will be changed.",
    saved: "Optional profile details saved.",
    save: "Save academic details and goals",
  },
  hi: {
    personal: "व्यक्तिगत जानकारी",
    academic: "शैक्षणिक जानकारी (वैकल्पिक)",
    goals: "परीक्षाएँ और सहमति",
    name: "पूरा नाम",
    confirm: "पासवर्ड की पुष्टि करें",
    phone: "मोबाइल नंबर (वैकल्पिक, सत्यापित नहीं)",
    gender: "लिंग (वैकल्पिक)",
    gender_description: "स्व-विवरण",
    qualification: "योग्यता",
    specialization: "विशेषज्ञता",
    academic_status: "वर्तमान शैक्षणिक स्थिति",
    academic_year: "शैक्षणिक वर्ष",
    exams: "मेरी परीक्षाएँ *",
    year: "लक्ष्य परीक्षा वर्ष (वैकल्पिक)",
    marketing: "मुझे वैकल्पिक विपणन और पाठ्यक्रम सूचनाएँ चाहिए।",
    next: "आगे",
    back: "पीछे",
    submit: "खाता बनाएँ",
    closed:
      "नीति समीक्षा और Development कॉन्फ़िगरेशन तक पंजीकरण बंद है। चरण देख सकते हैं, पर खाता नहीं बनेगा।",
    invalid: "आवश्यक जानकारी पूरी करें और प्रविष्टियाँ जाँचें।",
    mismatch: "पासवर्ड मेल नहीं खाते।",
    terms: "मैं नियम और शर्तों से सहमत हूँ।",
    privacy: "मैं गोपनीयता नीति की पुष्टि करता/करती हूँ।",
    unavailable:
      "परीक्षा सूची उपलब्ध नहीं है। परीक्षा लक्ष्य नहीं बदले जाएँगे।",
    saved: "वैकल्पिक प्रोफ़ाइल जानकारी सहेजी गई।",
    save: "शैक्षणिक विवरण और लक्ष्य सहेजें",
  },
};
export function AcademicFields({
  locale,
  details = {},
}: {
  locale: Locale;
  details?: Record<string, string>;
}) {
  const m = studentLabels[locale];
  return (
    <>
      <label>
        {m.gender}
        <select name="gender" defaultValue={details.gender ?? ""}>
          {[
            ["", locale === "hi" ? "चुनना आवश्यक नहीं" : "No selection"],
            ["female", locale === "hi" ? "महिला" : "Female"],
            ["male", locale === "hi" ? "पुरुष" : "Male"],
            ["nonbinary", locale === "hi" ? "गैर-द्विआधारी" : "Non-binary"],
            [
              "prefer_not",
              locale === "hi" ? "बताना नहीं चाहते" : "Prefer not to say",
            ],
            [
              "self_describe",
              locale === "hi" ? "स्वयं बताएँ" : "Self-describe",
            ],
          ].map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      </label>
      {(
        [
          "gender_description",
          "qualification",
          "specialization",
          "academic_status",
          "academic_year",
        ] as const
      ).map((key) => (
        <label key={key}>
          {m[key]}
          <input name={key} maxLength={120} defaultValue={details[key] ?? ""} />
        </label>
      ))}
    </>
  );
}
export function GoalFields({
  locale,
  exams,
  selected = [],
  year = "",
  marketing = false,
}: {
  locale: Locale;
  exams: ExamRecord[] | null;
  selected?: string[];
  year?: string;
  marketing?: boolean;
}) {
  const m = studentLabels[locale];
  return (
    <>
      <fieldset className="exam-choices">
        <legend>{m.exams}</legend>
        {exams?.map((e) => (
          <label className="auth-checkbox" key={e.id}>
            <input
              type="checkbox"
              name="exam_ids"
              value={e.id}
              defaultChecked={selected.includes(e.id)}
            />
            {locale === "hi" ? e.name_hi || e.name : e.name}
          </label>
        ))}
        {exams === null && <p role="status">{m.unavailable}</p>}
      </fieldset>
      <label>
        {m.year}
        <input
          type="number"
          name="target_year"
          min={new Date().getFullYear()}
          max={new Date().getFullYear() + 15}
          defaultValue={year}
        />
      </label>
      <label className="auth-checkbox">
        <input type="checkbox" name="marketing" defaultChecked={marketing} />
        {m.marketing}
      </label>
    </>
  );
}
