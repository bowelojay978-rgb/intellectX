import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms and Conditions - IntellectX",
  description: "Terms for using the IntellectX learning product.",
};

export default function TermsAndConditions() {
  return (
    <LegalPage
      title="Terms and Conditions"
      description="These terms describe the basic expectations for using IntellectX and its learning tools."
      sections={[
        {
          title: "Overview",
          body: [
            "IntellectX is an education SaaS/MVP available at https://intellect-x-coral.vercel.app. By using the product, you agree to use it responsibly and only for lawful learning, study, and productivity purposes.",
            "These terms are general product terms and should be reviewed by a qualified legal professional before a full commercial launch.",
          ],
        },
        {
          title: "Product Status",
          body: [
            "Some IntellectX features may be prototypes, demos, or previews. Demo data, local browser storage, sample course content, and experimental interfaces may change without notice.",
            "We aim to keep the product useful and reliable, but we do not guarantee uninterrupted availability, permanent access to prototype data, or that every feature will remain available in the same form.",
          ],
        },
        {
          title: "Accounts and Access",
          body: [
            "If account features are enabled, you are responsible for keeping your login details secure and for activity that occurs through your account.",
            "You should provide accurate information where required and avoid impersonating another person or misusing demo authentication flows.",
          ],
        },
        {
          title: "Learning Content",
          body: [
            "Course lessons, quizzes, notes, dashboards, and progress indicators are provided for educational support. They are not a substitute for professional, academic, legal, financial, medical, or safety advice.",
            "Quiz scores and progress summaries are intended to help guide study habits. They should not be treated as official certifications, grades, or guarantees of performance.",
          ],
        },
        {
          title: "Acceptable Use",
          body: [
            "Do not use IntellectX to upload unlawful, harmful, abusive, infringing, confidential, or sensitive personal content that you do not have the right to use.",
            "Do not attempt to disrupt the product, bypass access controls, scrape at unreasonable volume, probe security boundaries, or interfere with other users.",
          ],
        },
        {
          title: "Payments and Plans",
          body: [
            "If paid plans or checkout are enabled, prices, billing cycles, and plan details should be reviewed before purchase. Payment processing may be handled by third-party processors under their own terms.",
            "Access to paid features may depend on successful payment, plan availability, and the product configuration active at the time.",
          ],
        },
        {
          title: "AI Features",
          body: [
            "IntellectX may include or add AI-supported learning features. AI outputs can be incomplete or incorrect, so users should review important information independently.",
            "Do not submit sensitive personal data or confidential third-party material to AI features unless you are comfortable with the processing needed to provide those features.",
          ],
        },
        {
          title: "Intellectual Property",
          body: [
            "IntellectX branding, interface design, and product content are owned by their respective rights holders. You may use the product for personal learning unless a separate agreement says otherwise.",
            "You retain responsibility for content you add, including notes or prompts. You should only add content you own or have permission to use.",
          ],
        },
        {
          title: "Limitation of Liability",
          body: [
            "To the extent permitted by applicable law, IntellectX is provided without promises that it will meet every requirement or be error-free.",
            "IntellectX should not be liable for indirect losses, lost data, missed learning goals, or decisions made based on prototype content, except where liability cannot legally be limited.",
          ],
        },
        {
          title: "Changes",
          body: [
            "These terms may be updated as IntellectX evolves. Continued use after updates means you accept the revised terms.",
            "If a change is significant, the product should make reasonable efforts to surface the updated terms in an appropriate way.",
          ],
        },
      ]}
    />
  );
}
