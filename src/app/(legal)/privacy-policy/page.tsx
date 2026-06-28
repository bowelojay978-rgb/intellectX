import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy - IntellectX",
  description: "How IntellectX handles account, learning, and product data.",
};

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="This policy explains the information IntellectX may collect, how it may be used, and the choices learners should understand before using the product."
      sections={[
        {
          title: "Overview",
          body: [
            "IntellectX is an education platform available at https://intellect-x-coral.vercel.app. The product provides learning pages, course content, quizzes, notes, profile views, and progress experiences.",
            "This policy is written in plain language for product transparency. It should be reviewed by a qualified legal professional before a full commercial launch.",
          ],
        },
        {
          title: "Information We May Collect",
          body: [
            "If account features are enabled, IntellectX may collect account details such as a name, email address, login state, and basic profile preferences.",
            "The product may store learning activity such as course progress, lesson completion, notes, quiz attempts, quiz scores, and dashboard activity so learners can continue where they left off.",
            "We may collect technical information such as browser type, device information, page activity, errors, and approximate usage patterns to keep the product reliable and improve the learning experience.",
          ],
        },
        {
          title: "Notes, Quiz Activity, and Learning Progress",
          body: [
            "Notes and quiz activity are meant for study support. Users should avoid adding sensitive personal data, financial information, health information, government identifiers, or confidential third-party content unless clearly necessary and appropriate.",
            "Learning progress may be shown inside dashboard, progress, profile, lesson, and quiz views. Some learning experiences may rely on local browser storage until account-level persistence is configured.",
          ],
        },
        {
          title: "Payments",
          body: [
            "If paid plans or checkout are enabled, payments may be handled by third-party payment processors. IntellectX should not ask users to enter full payment card details directly into ordinary learning pages.",
            "Payment processors may collect and process payment information under their own terms and privacy policies.",
          ],
        },
        {
          title: "AI Features",
          body: [
            "IntellectX may include or add AI-supported learning features over time. Where AI features are available, prompts, notes, learning context, or generated outputs may be processed to provide the requested feature.",
            "Users should not submit sensitive personal data to AI features unless they understand and accept the risks of doing so.",
          ],
        },
        {
          title: "How Information May Be Used",
          body: [
            "Information may be used to operate the app, maintain accounts, display progress, save learning activity, provide support, improve product quality, troubleshoot issues, prevent abuse, and communicate important product updates.",
            "We do not use this policy to claim compliance with a specific privacy law or certification that has not been independently verified.",
          ],
        },
        {
          title: "Data Sharing",
          body: [
            "IntellectX may rely on service providers for hosting, analytics, authentication, data storage, payments, email, support, or similar product operations. These providers should only receive information needed to perform their services.",
            "Information may also be disclosed if required by law, to protect product security, or to respond to valid legal requests.",
          ],
        },
        {
          title: "Your Choices",
          body: [
            "Users can choose what they enter into notes, quizzes, and profile fields. Browser storage can often be cleared through browser settings, although that may remove locally stored progress.",
            "If account data controls are added, they should provide a practical way to update, export, or delete relevant account information where appropriate.",
          ],
        },
        {
          title: "Contact and Updates",
          body: [
            "Questions about this policy can be raised through the contact channel provided in the product or repository materials for the current IntellectX release.",
            "This policy may be updated as the product changes. The effective date above will be revised when meaningful changes are made.",
          ],
        },
      ]}
    />
  );
}



