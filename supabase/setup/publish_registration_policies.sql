-- ONE-TIME OWNER-REQUESTED ACTIVATION, not an automatically applied migration.
-- Read the four policy texts before running. Run AFTER 202609300002_restore_secure_registration.sql.
-- Effective/reviewed timestamps record the operator's execution of this reviewed script;
-- they do not assert independent legal review or certification.
-- No existing policy is overwritten. Unexpected existing versions stop the transaction.
begin;
lock table public.legal_policy_versions in share row exclusive mode;
do $$ begin
 if exists(select 1 from public.legal_policy_versions where kind in ('terms','privacy') and locale in ('en','hi') and (is_current or version='public-signup-v1')) then
   raise exception 'Policies already exist: review current versions before activation; no changes made';
 end if;
end $$;

insert into public.legal_policy_versions(kind,locale,version,body,status,effective_at,reviewed_at,is_current) values
('terms','en','public-signup-v1',$policy$About BioScience Mastery
BioScience Mastery is an independent education platform operated by an individual, not an official examination authority. These terms govern use of the platform. Applicable jurisdiction: Rajasthan, India, subject to mandatory legal rights. Support: biosciencemastery@gmail.com.

Accounts and consent
Provide accurate account information, keep your password confidential and confirm your email address. You must agree to these Terms and acknowledge the Privacy Policy separately when registering. Where permission from a parent or guardian is required by applicable law, obtain it before providing personal information or using an account. Contact support if you are unsure. Optional mobile numbers are not verified. Do not impersonate others, bypass access controls, disrupt the service or submit material without permission.

Educational resources
Course information does not mean lessons are published or enrollment is open. Access is limited to resources made available under the platform's access controls. Learning materials do not guarantee admission, examination results or employment. Check official examination information with the responsible authority. Copyright and licensing restrictions apply; access does not grant permission to redistribute content. BioScience Mastery summaries do not imply official endorsement.

Free service and future payments
Payments are not currently accepted. Razorpay is planned, not active. Any future paid offering must disclose prices, access terms and applicable cancellation/refund conditions before purchase. No draft refund proposal is an active purchase contract. These terms do not exclude mandatory consumer rights.

Preferences and account closure
Optional academic information, examination goals and language preferences can be edited in account settings. Marketing consent is optional and separate from registration consent. Launch notifications and marketing delivery remain disabled. Account settings provide an account-deletion request; submitting it does not mean deletion has already completed. Contact support about access, correction or deletion. Never send passwords, tokens or API keys by email.

Policy versions and contact
The version and effective date shown on this page identify these terms. Future published versions must remain distinguishable from previously accepted versions. Contact biosciencemastery@gmail.com for questions or concerns. No personal owner name, postal address or business-registration status is asserted by these terms.$policy$,'published',now(),now(),true),
('privacy','en','public-signup-v1',$policy$Scope and contact
This policy describes the current account features of BioScience Mastery, an independently operated education platform. Jurisdiction: Rajasthan, India, subject to applicable rights. Contact: biosciencemastery@gmail.com. It does not certify legal compliance or assert an undisclosed operator identity or address.

Information and purposes
Registration uses your name, email address and password. Supabase Auth handles passwords; the application does not store them in profile or consent tables. Account information supports sign-in, confirmation and account security. Optional academic details include mobile number, gender/self-description, qualification, specialization and academic status/year. Examination goals and target year personalize your account. A supplied phone number is not verified. Avoid entering sensitive information that is unnecessary for these features.

Consent and preferences
The database records which Terms and Privacy versions you accepted and when. Optional marketing consent is recorded separately and may be changed in account settings. Notification/email marketing delivery, external AI and automated examination monitoring remain disabled. No private profile or consent record is sent to an AI provider by this implementation.

Providers and browser storage
The website uses Vercel hosting and Supabase authentication/database services. They process information needed to provide those functions. Authentication uses session cookies; the browser stores theme preference under bsm-theme. Account confirmation and password recovery use Supabase authentication email when configured. These transactional messages are distinct from optional marketing. Razorpay payments and profile-photo upload are not active account features.

Access, correction and deletion
You can edit optional profile information and examination goals in account settings, and request account deletion there or by contacting support. Requests require appropriate identity verification. A request is not confirmation of completed erasure. Account records remain stored until processed for deletion; records or backups may remain where required for security, recovery or applicable legal obligations. This policy does not promise an unimplemented automatic deletion schedule or a fixed retention period. Ask support for the handling and status of a particular request. Do not email passwords, API keys or identity documents without an agreed secure process.

Children and changes
Where applicable law requires parent or guardian authorization, obtain it before providing personal information; contact support with concerns about a child's account. The service does not claim to provide an automated guardian-verification process. New data uses, payment features or photo uploads require an updated disclosure before activation. Published versions retain their version and effective date so prior acknowledgements can be identified.$policy$,'published',now(),now(),true),
('terms','hi','public-signup-v1',$policy$BioScience Mastery के बारे में
BioScience Mastery एक व्यक्तिगत संचालक द्वारा संचालित स्वतंत्र शिक्षा मंच है, आधिकारिक परीक्षा प्राधिकरण नहीं। ये शर्तें मंच के उपयोग पर लागू होती हैं। लागू न्यायक्षेत्र: राजस्थान, भारत, अनिवार्य कानूनी अधिकारों के अधीन। सहायता: biosciencemastery@gmail.com।

खाता और सहमति
खाते की सही जानकारी दें, पासवर्ड निजी रखें और ईमेल की पुष्टि करें। पंजीकरण के समय इन शर्तों की स्वीकृति और गोपनीयता नीति की जानकारी होने की पुष्टि अलग-अलग आवश्यक हैं। जहाँ लागू कानून माता-पिता या अभिभावक की अनुमति माँगता है, व्यक्तिगत जानकारी देने या खाता उपयोग करने से पहले वह अनुमति लें। संदेह होने पर सहायता से संपर्क करें। वैकल्पिक मोबाइल नंबर सत्यापित नहीं किए जाते। किसी और की पहचान न अपनाएँ, पहुँच नियंत्रण न तोड़ें, सेवा बाधित न करें और बिना अनुमति सामग्री जमा न करें।

शैक्षिक संसाधन
पाठ्यक्रम की जानकारी का अर्थ यह नहीं कि पाठ प्रकाशित हैं या प्रवेश खुला है। केवल उपलब्ध कराए गए संसाधन उनके पहुँच नियमों के अनुसार उपयोग किए जा सकते हैं। सामग्री प्रवेश, परीक्षा परिणाम या रोजगार की गारंटी नहीं देती। आधिकारिक परीक्षा जानकारी संबंधित प्राधिकरण से जाँचें। कॉपीराइट और लाइसेंस लागू हैं; पहुँच मिलने से पुनर्वितरण की अनुमति नहीं मिलती। BioScience Mastery के सारांश आधिकारिक समर्थन का दावा नहीं करते।

निःशुल्क सेवा और भविष्य के भुगतान
अभी भुगतान स्वीकार नहीं किए जाते। Razorpay प्रस्तावित है, सक्रिय नहीं। भविष्य की सशुल्क सेवा के लिए खरीद से पहले कीमत, पहुँच, रद्द करने और धनवापसी की लागू शर्तें बतानी होंगी। मसौदा धनवापसी प्रस्ताव सक्रिय खरीद अनुबंध नहीं है। ये शर्तें अनिवार्य उपभोक्ता अधिकार समाप्त नहीं करतीं।

पसंद और खाता बंद करना
वैकल्पिक शैक्षिक जानकारी, परीक्षा लक्ष्य और भाषा खाता सेटिंग में बदल सकते हैं। मार्केटिंग सहमति वैकल्पिक है और पंजीकरण सहमति से अलग है। पाठ्यक्रम सूचनाएँ और मार्केटिंग भेजना बंद है। खाता सेटिंग में खाता हटाने का अनुरोध किया जा सकता है; अनुरोध भेजने का अर्थ हटाने की प्रक्रिया पूरी होना नहीं है। पहुँच, सुधार या हटाने के लिए सहायता से संपर्क करें। पासवर्ड, टोकन या API कुंजी ईमेल से कभी न भेजें।

नीति संस्करण और संपर्क
इस पृष्ठ का संस्करण और प्रभावी तिथि इन शर्तों की पहचान हैं। भविष्य के प्रकाशित संस्करण पहले स्वीकृत संस्करणों से अलग पहचाने जाने चाहिए। प्रश्नों के लिए biosciencemastery@gmail.com पर संपर्क करें। ये शर्तें संचालक के किसी व्यक्तिगत नाम, डाक पते या व्यवसाय पंजीकरण का दावा नहीं करतीं।$policy$,'published',now(),now(),true),
('privacy','hi','public-signup-v1',$policy$दायरा और संपर्क
यह नीति स्वतंत्र रूप से संचालित शिक्षा मंच BioScience Mastery की वर्तमान खाता सुविधाओं का वर्णन करती है। न्यायक्षेत्र: राजस्थान, भारत, लागू अधिकारों के अधीन। संपर्क: biosciencemastery@gmail.com। यह कानूनी अनुपालन का प्रमाणपत्र नहीं है और संचालक की अघोषित पहचान या पते का दावा नहीं करती।

जानकारी और उद्देश्य
पंजीकरण में नाम, ईमेल और पासवर्ड उपयोग होते हैं। पासवर्ड Supabase Auth संभालता है; ऐप उन्हें प्रोफ़ाइल या सहमति तालिकाओं में नहीं रखता। खाता जानकारी साइन इन, ईमेल पुष्टि और सुरक्षा के लिए है। वैकल्पिक जानकारी में मोबाइल नंबर, लिंग/स्व-विवरण, योग्यता, विशेषज्ञता और शैक्षिक स्थिति/वर्ष शामिल हैं। परीक्षा लक्ष्य और लक्ष्य वर्ष खाते को व्यक्तिगत बनाते हैं। दिया गया फोन नंबर सत्यापित नहीं होता। इन सुविधाओं के लिए अनावश्यक संवेदनशील जानकारी न दें।

सहमति और पसंद
डेटाबेस स्वीकृत शर्तों और गोपनीयता नीति के संस्करण तथा स्वीकृति का समय दर्ज करता है। वैकल्पिक मार्केटिंग सहमति अलग दर्ज होती है और खाता सेटिंग में बदली जा सकती है। मार्केटिंग ईमेल/सूचनाएँ, बाहरी AI और स्वचालित परीक्षा निगरानी बंद हैं। इस कार्यान्वयन में निजी प्रोफ़ाइल या सहमति रिकॉर्ड AI प्रदाता को नहीं भेजे जाते।

सेवा प्रदाता और ब्राउज़र भंडारण
वेबसाइट Vercel होस्टिंग और Supabase प्रमाणीकरण/डेटाबेस सेवाएँ उपयोग करती है। वे इन कार्यों के लिए आवश्यक जानकारी संसाधित करते हैं। प्रमाणीकरण सत्र कुकी उपयोग करता है; ब्राउज़र bsm-theme में थीम पसंद रखता है। कॉन्फ़िगर होने पर खाते की पुष्टि और पासवर्ड पुनर्प्राप्ति के लिए Supabase प्रमाणीकरण ईमेल उपयोग होता है। ये आवश्यक खाता संदेश वैकल्पिक मार्केटिंग से अलग हैं। Razorpay भुगतान और प्रोफ़ाइल फोटो अपलोड सक्रिय खाता सुविधाएँ नहीं हैं।

पहुँच, सुधार और हटाना
वैकल्पिक प्रोफ़ाइल जानकारी और परीक्षा लक्ष्य खाता सेटिंग में बदल सकते हैं। वहीं या सहायता से संपर्क करके खाता हटाने का अनुरोध कर सकते हैं। अनुरोध के लिए उचित पहचान सत्यापन आवश्यक है। अनुरोध भेजना जानकारी पूरी तरह मिट जाने की पुष्टि नहीं है। खाता रिकॉर्ड हटाने की प्रक्रिया पूरी होने तक रहते हैं; सुरक्षा, पुनर्प्राप्ति या लागू कानूनी दायित्वों के लिए आवश्यक रिकॉर्ड या बैकअप बने रह सकते हैं। यह नीति लागू न हुई स्वचालित हटाने की समय-सारणी या निश्चित भंडारण अवधि का वादा नहीं करती। किसी अनुरोध की प्रक्रिया और स्थिति सहायता से पूछें। सहमत सुरक्षित प्रक्रिया के बिना पासवर्ड, API कुंजी या पहचान दस्तावेज़ ईमेल न करें।

बच्चे और बदलाव
जहाँ लागू कानून माता-पिता या अभिभावक की अनुमति माँगता है, जानकारी देने से पहले अनुमति लें; बच्चे के खाते से जुड़ी चिंता पर सहायता से संपर्क करें। सेवा स्वचालित अभिभावक सत्यापन का दावा नहीं करती। नए डेटा उपयोग, भुगतान या फोटो अपलोड चालू होने से पहले अद्यतन जानकारी देना आवश्यक है। प्रकाशित संस्करण और प्रभावी तिथि सुरक्षित रहते हैं ताकि पुरानी स्वीकृतियाँ पहचानी जा सकें।$policy$,'published',now(),now(),true);

-- Preserve the database gate and consent validation; enable only after all four inserts succeed.
insert into private.registration_config(id,enabled) values(true,true)
on conflict(id) do update set enabled=true;
commit;
