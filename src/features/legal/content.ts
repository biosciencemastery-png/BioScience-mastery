import type { Locale } from "@/lib/i18n";
export const policyKinds = ["terms", "privacy", "refund-policy"] as const;
export type PolicyKind = (typeof policyKinds)[number];
export const draftVersion = "2026-09-28-draft";
export const policyTitles = {
  en: {
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    "refund-policy": "Refund Policy",
  },
  hi: {
    terms: "नियम और शर्तें",
    privacy: "गोपनीयता नीति",
    "refund-policy": "धनवापसी नीति",
  },
};
// REVIEW REQUIRED: operator identity/address, jurisdiction, minors, retention and payment terms.
// These drafts must never be treated as published consent documents.
const content: Record<Locale, Record<PolicyKind, string>> = {
  en: {
    terms: `About BioScience Mastery
BioScience Mastery is an education platform operated by an individual. The operator's legal name, address and applicable jurisdiction require review before these terms become effective. We do not claim to be a registered company or an official examination authority.

Accounts and responsible use
When registration opens, provide accurate account details and keep your password private. Email confirmation is required. Optional mobile numbers are not verified. Do not impersonate others, share unauthorized access, disrupt the service or upload material you do not have permission to use. Eligibility and rules for minors remain REVIEW REQUIRED; public signup remains closed.

Learning materials
Course information does not mean lessons are published or enrollment is open. Only published resources are available through their stated access controls. Materials are for learning and do not guarantee admission, examination results or employment. Official examination information should be checked with the responsible authority. Copyright and licenses continue to apply; access is not permission to redistribute material.

Free and future paid courses
The current platform does not accept payments. Free resources and any future paid course offerings will be clearly distinguished. Razorpay is planned, not active. Prices, taxes, access duration, cancellation and refund terms must be reviewed and disclosed before any paid purchase is offered.

Personal information and notifications
Read the separate Privacy Policy. Optional academic details and examination goals can be changed in account settings. Marketing permission is separate from accepting these terms and can be withdrawn. Course launch subscriptions use their own confirmation and unsubscribe process.

Account closure and support
Account settings support a deletion request, not an immediate promise that all data is erased. Identity verification, processing, retention and backup handling require a finalized procedure. Contact the support email shown below for account or content concerns. Do not email passwords, API keys or other secrets.

Changes and legal review
Published terms will have a version and effective date. Material changes and any required renewed acceptance will be communicated before they apply. Mandatory consumer rights are not excluded. Dispute handling, jurisdiction and any limitations of responsibility remain REVIEW REQUIRED; this draft is not a finalized contract.`,
    privacy: `Scope and status
This draft explains the intended handling of information by the individual operator of BioScience Mastery. The operator's legal identity, address and privacy responsibilities require review. This document has no effective date yet and public registration remains closed.

Information supplied by you
Account registration uses a full name, email and password. Passwords are handled through Supabase Auth and are not stored in academic profiles or consent records. Optional information includes a mobile number, gender/self-description, qualification, specialization, academic status/year, target examinations and target year. A mobile number is not phone verification. Avoid sensitive information that is not needed for studying.

Purposes and account control
Account details support sign-in, email confirmation and account security. Academic details and exam goals personalize the account profile; you can edit or remove these optional details. Consent records identify the policy versions accepted and the time of acceptance. Marketing permission is optional and can be changed separately. Launch alerts require email confirmation and offer unsubscribe links.

Profile photos and learning activity
Phase 4 does not provide profile-photo upload or collect a photo during signup. Before any future photo feature is enabled, its purpose, private storage, access, removal and retention rules must be reviewed and disclosed. Future learning progress and assessment data will require their own reviewed handling rules; this draft does not claim those features are active.

Service providers and browser storage
The application uses Next.js, Vercel hosting and Supabase account/database services when configured. Resend notification delivery is prepared but disabled until configured and approved. Razorpay is planned and inactive. The browser stores the theme choice under bsm-theme; authentication uses session cookies when enabled. No advertising or AI-provider data sharing is introduced by Phase 4. Provider locations, subprocessors and any cross-border arrangements require review before launch.

Retention, access and deletion
You may contact support to ask about your information or request correction/deletion, and account settings support deletion requests. A request is not proof of completed erasure. Exact retention periods, identity checks, backup deletion, response deadlines and any legally required exceptions remain REVIEW REQUIRED. Do not send passwords or identity documents unless a suitable secure process is separately established.

Minors and policy changes
Age eligibility and any guardian-consent procedure remain REVIEW REQUIRED. Public registration stays closed until these questions and the rest of this policy are reviewed. Published versions will display their effective dates; necessary notices and renewed acknowledgements will be handled before relevant changes apply.`,
    "refund-policy": `Draft proposal — payments inactive
BioScience Mastery does not currently accept course payments. Razorpay is planned, not active. This proposal is for legal and owner review, not an active offer or finalized refund promise. Free courses have no course fee to refund.

Proposed time bands
Measured from the successful payment timestamp to receipt of the refund request, the proposed bands are: from 0 through 1 hour: 100%; more than 1 through 2 hours: 75%; more than 2 through 3 hours: 60%; more than 3 through 4 hours: 40%; more than 4 through 5 hours: 20%; more than 5 hours: normally 0%, subject to mandatory legal rights. Exactly 1, 2, 3, 4 or 5 hours belongs to the band ending at that boundary. This boundary interpretation requires approval before paid sales.

Requesting and processing a refund
The proposed process is to contact support with an order reference and request details, never card credentials or passwords. The proposed processing target for eligible approved requests is 7 working days after approval. Bank credit timing can vary. The definition of working days, timestamp/time-zone handling, request receipt evidence and approval workflow remain REVIEW REQUIRED.

Fees and exceptional situations
Whether percentages apply to the full amount including taxes, and how payment-gateway fees are treated, must be reviewed and disclosed before checkout. No gateway-fee deduction is authorized by this draft. Duplicate payments, failed access, cancelled courses, misdescription, statutory remedies and other mandatory consumer rights must be handled under applicable requirements and the final policy. Do not interpret the time bands as removing those rights.

Before paid launch
Finalize the operator identity, legal address, jurisdiction, course access terms, fee/tax treatment, refund boundaries and support procedure. Publish an approved version and effective date before offering payments. No refund or payment automation is enabled by this page.`,
  },
  hi: {
    terms: `BioScience Mastery के बारे में
BioScience Mastery एक व्यक्तिगत संचालक द्वारा संचालित शिक्षा मंच है। संचालक का कानूनी नाम, पता और लागू न्यायक्षेत्र इन शर्तों के प्रभावी होने से पहले समीक्षा के लिए लंबित हैं। हम पंजीकृत कंपनी या आधिकारिक परीक्षा प्राधिकरण होने का दावा नहीं करते।

खाता और जिम्मेदार उपयोग
पंजीकरण खुलने पर सही विवरण दें और पासवर्ड निजी रखें। ईमेल पुष्टि आवश्यक है। वैकल्पिक मोबाइल नंबर का सत्यापन नहीं किया जाता। किसी और की पहचान न अपनाएँ, अनधिकृत पहुँच साझा न करें, सेवा बाधित न करें और बिना अनुमति सामग्री अपलोड न करें। नाबालिगों की पात्रता और नियमों की समीक्षा आवश्यक है; सार्वजनिक पंजीकरण बंद है।

अध्ययन सामग्री
पाठ्यक्रम की जानकारी का अर्थ यह नहीं कि पाठ प्रकाशित हैं या प्रवेश खुला है। केवल प्रकाशित संसाधन निर्धारित पहुँच नियमों के अनुसार उपलब्ध होंगे। सामग्री शिक्षा के लिए है; प्रवेश, परीक्षा परिणाम या नौकरी की गारंटी नहीं देती। आधिकारिक जानकारी संबंधित परीक्षा प्राधिकरण से जाँचें। कॉपीराइट और लाइसेंस लागू रहते हैं; पहुँच मिलने का अर्थ पुनर्वितरण की अनुमति नहीं है।

निःशुल्क और भविष्य के सशुल्क पाठ्यक्रम
मंच अभी भुगतान स्वीकार नहीं करता। निःशुल्क संसाधन और भविष्य के सशुल्क पाठ्यक्रम स्पष्ट रूप से अलग बताए जाएँगे। Razorpay प्रस्तावित है, सक्रिय नहीं। कीमत, कर, पहुँच अवधि, रद्द करने और धनवापसी के नियम भुगतान शुरू होने से पहले समीक्षा और प्रकाशन के अधीन हैं।

निजी जानकारी और सूचनाएँ
अलग गोपनीयता नीति पढ़ें। वैकल्पिक शैक्षणिक विवरण और परीक्षा लक्ष्य खाता सेटिंग में बदले जा सकते हैं। विपणन अनुमति इन शर्तों से अलग और वापस लेने योग्य है। पाठ्यक्रम लॉन्च सूचनाओं की अलग पुष्टि और सदस्यता समाप्ति प्रक्रिया है।

खाता बंद करना और सहायता
खाता सेटिंग से हटाने का अनुरोध किया जा सकता है; इसका अर्थ तुरंत सभी डेटा मिटना नहीं है। पहचान जाँच, प्रक्रिया, संरक्षण और बैकअप नियमों को अंतिम रूप देना बाकी है। नीचे दिए सहायता ईमेल पर संपर्क करें। पासवर्ड, API कुंजी या अन्य गोपनीय जानकारी ईमेल न करें।

बदलाव और कानूनी समीक्षा
प्रकाशित शर्तों का संस्करण और प्रभावी तिथि होगी। महत्वपूर्ण बदलाव और आवश्यक नई सहमति लागू होने से पहले सूचित किए जाएँगे। अनिवार्य उपभोक्ता अधिकार सीमित नहीं किए जाते। विवाद प्रक्रिया, न्यायक्षेत्र और जिम्मेदारी की सीमाओं की समीक्षा आवश्यक है; यह अंतिम अनुबंध नहीं है।`,
    privacy: `दायरा और स्थिति
यह मसौदा BioScience Mastery के व्यक्तिगत संचालक द्वारा जानकारी के प्रस्तावित उपयोग को बताता है। संचालक की कानूनी पहचान, पता और गोपनीयता जिम्मेदारियों की समीक्षा बाकी है। अभी कोई प्रभावी तिथि नहीं है और सार्वजनिक पंजीकरण बंद है।

आपके द्वारा दी गई जानकारी
पंजीकरण में पूरा नाम, ईमेल और पासवर्ड लिया जाता है। पासवर्ड Supabase Auth संभालता है; शैक्षणिक प्रोफ़ाइल या सहमति रिकॉर्ड में नहीं रखा जाता। वैकल्पिक विवरण में मोबाइल, लिंग/स्व-विवरण, योग्यता, विशेषज्ञता, शैक्षणिक स्थिति/वर्ष, लक्ष्य परीक्षाएँ और परीक्षा वर्ष शामिल हैं। मोबाइल नंबर देना फोन सत्यापन नहीं है। अध्ययन के लिए अनावश्यक संवेदनशील जानकारी न दें।

उद्देश्य और नियंत्रण
खाते की जानकारी प्रवेश, ईमेल पुष्टि और सुरक्षा के लिए है। शैक्षणिक विवरण और परीक्षा लक्ष्य प्रोफ़ाइल को अनुकूल बनाते हैं; इन्हें बदल या हटा सकते हैं। सहमति रिकॉर्ड में स्वीकार किए गए नीति संस्करण और समय दर्ज होते हैं। विपणन अनुमति वैकल्पिक है और अलग बदली जा सकती है। लॉन्च सूचनाओं के लिए ईमेल पुष्टि और सदस्यता समाप्ति लिंक हैं।

प्रोफ़ाइल फोटो और अध्ययन गतिविधि
Phase 4 में फोटो अपलोड या पंजीकरण के दौरान फोटो संग्रह नहीं है। भविष्य में फोटो सुविधा शुरू करने से पहले उसका उद्देश्य, निजी भंडारण, पहुँच, हटाना और संरक्षण नियमों की समीक्षा और जानकारी देना आवश्यक है। भविष्य की प्रगति और परीक्षा गतिविधि के डेटा के लिए भी समीक्षा किए गए नियम चाहिए; यह मसौदा उन सुविधाओं के सक्रिय होने का दावा नहीं करता।

सेवा प्रदाता और ब्राउज़र भंडारण
कॉन्फ़िगरेशन होने पर ऐप Next.js, Vercel होस्टिंग और Supabase खाता/डेटाबेस सेवाओं का उपयोग करता है। Resend सूचना व्यवस्था तैयार है पर कॉन्फ़िगरेशन और स्वीकृति तक बंद है। Razorpay प्रस्तावित और निष्क्रिय है। थीम पसंद bsm-theme नाम से ब्राउज़र में रहती है; प्रमाणीकरण चालू होने पर सत्र कुकी उपयोग होती है। Phase 4 विज्ञापन या AI प्रदाता से डेटा साझा करना शुरू नहीं करता। प्रदाता स्थान, उप-प्रदाता और सीमा-पार व्यवस्था की समीक्षा लंबित है।

संरक्षण, पहुँच और हटाना
जानकारी, सुधार या हटाने के लिए सहायता से संपर्क कर सकते हैं; खाता सेटिंग में हटाने का अनुरोध उपलब्ध है। अनुरोध का अर्थ मिटाने का काम पूरा होना नहीं है। संरक्षण अवधि, पहचान जाँच, बैकअप हटाना, उत्तर की समयसीमा और कानूनी अपवादों की समीक्षा आवश्यक है। अलग सुरक्षित प्रक्रिया तय हुए बिना पासवर्ड या पहचान दस्तावेज न भेजें।

नाबालिग और नीति बदलाव
आयु पात्रता और अभिभावक सहमति प्रक्रिया की समीक्षा बाकी है। नीति और इन प्रश्नों की समीक्षा तक सार्वजनिक पंजीकरण बंद रहेगा। प्रकाशित संस्करणों में प्रभावी तिथि दिखाई जाएगी; संबंधित बदलावों से पहले आवश्यक सूचना और नई स्वीकृति ली जाएगी।`,
    "refund-policy": `मसौदा प्रस्ताव — भुगतान निष्क्रिय
BioScience Mastery अभी पाठ्यक्रम भुगतान स्वीकार नहीं करता। Razorpay प्रस्तावित है, सक्रिय नहीं। यह मालिक और कानूनी समीक्षा का प्रस्ताव है, सक्रिय पेशकश या अंतिम धनवापसी वादा नहीं। निःशुल्क पाठ्यक्रम में वापस करने के लिए पाठ्यक्रम शुल्क नहीं होता।

प्रस्तावित समय सीमाएँ
सफल भुगतान के समय से धनवापसी अनुरोध मिलने तक: 0 से 1 घंटे तक 100%; 1 घंटे से अधिक और 2 घंटे तक 75%; 2 से अधिक और 3 घंटे तक 60%; 3 से अधिक और 4 घंटे तक 40%; 4 से अधिक और 5 घंटे तक 20%; 5 घंटे के बाद सामान्यतः 0%, अनिवार्य कानूनी अधिकारों के अधीन। ठीक 1, 2, 3, 4 या 5 घंटे उस सीमा पर समाप्त होने वाले वर्ग में आएँगे। इस व्याख्या को भुगतान शुरू होने से पहले स्वीकृति चाहिए।

अनुरोध और प्रक्रिया
प्रस्तावित प्रक्रिया में ऑर्डर संदर्भ और अनुरोध विवरण सहायता को भेजना शामिल है; कार्ड की गोपनीय जानकारी या पासवर्ड कभी नहीं। पात्र और स्वीकृत अनुरोधों को स्वीकृति के बाद 7 कार्य दिवस में संसाधित करने का लक्ष्य प्रस्तावित है। बैंक में राशि आने का समय अलग हो सकता है। कार्य दिवस, समय क्षेत्र, अनुरोध प्राप्ति का प्रमाण और स्वीकृति प्रक्रिया की समीक्षा बाकी है।

शुल्क और विशेष परिस्थितियाँ
प्रतिशत कर सहित पूरी राशि पर लागू होगा या नहीं और भुगतान गेटवे शुल्क का व्यवहार क्या होगा, इसे भुगतान से पहले समीक्षा कर स्पष्ट करना होगा। यह मसौदा गेटवे शुल्क काटने की अनुमति नहीं देता। दोहरा भुगतान, पहुँच न मिलना, रद्द पाठ्यक्रम, गलत विवरण और अन्य अनिवार्य उपभोक्ता अधिकार अंतिम नीति और लागू आवश्यकताओं के अनुसार संभाले जाएँगे। समय सीमाएँ उन अधिकारों को समाप्त नहीं करतीं।

सशुल्क शुरुआत से पहले
संचालक की पहचान, कानूनी पता, न्यायक्षेत्र, पहुँच नियम, शुल्क/कर, सीमाएँ और सहायता प्रक्रिया अंतिम करें। भुगतान से पहले स्वीकृत संस्करण और प्रभावी तिथि प्रकाशित करें। यह पृष्ठ भुगतान या धनवापसी स्वचालन चालू नहीं करता।`,
  },
};
export const draftPolicy = (locale: Locale, kind: PolicyKind) => ({
  title: policyTitles[locale][kind],
  body: content[locale][kind],
  version: draftVersion,
  effective_at: null as string | null,
  status: "draft" as "draft" | "published",
});
