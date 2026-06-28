import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Refund Policy - IntellectX",
  description: "Refund guidance for IntellectX purchases when paid plans are enabled.",
};

export default function RefundPolicy() {
  return (
    <LegalPage
      title="Refund Policy"
      description="This policy explains how refund requests may be reviewed if paid IntellectX plans or checkout are enabled."
      sections={[
        {
          title: "Overview",
          body: [
            "IntellectX is an education platform available at https://intellect-x-coral.vercel.app. Some releases may include paid plans, checkout, subscriptions, or preview pricing.",
            "This refund policy is general product guidance and should be reviewed by a qualified legal professional before a full commercial launch.",
          ],
        },
        {
          title: "Before You Purchase",
          body: [
            "Please review the plan name, price, billing cycle, included features, trial details if any, and checkout summary before completing a purchase.",
            "Because IntellectX may be evolving quickly, feature availability can depend on the active release, environment configuration, and third-party service status.",
          ],
        },
        {
          title: "Refund Requests",
          body: [
            "Refund requests may be reviewed case by case. Submitting a request does not guarantee that a refund will be approved automatically.",
            "A request is more likely to be considered when it is made promptly, includes the purchase email or receipt reference, and explains the issue clearly.",
          ],
        },
        {
          title: "Subscriptions and Renewals",
          body: [
            "If subscriptions are enabled, cancelling a subscription should stop future renewals but may not automatically refund charges that have already been processed.",
            "Access after cancellation may continue until the end of the current billing period, depending on how the active payment provider and product plan are configured.",
          ],
        },
        {
          title: "Technical Issues",
          body: [
            "If a payment succeeds but access does not activate, users should report the issue with the relevant account email, receipt details, and a short description of what happened.",
            "Where a technical problem prevents reasonable use of a paid feature, IntellectX may attempt to restore access, provide guidance, or review whether a refund is appropriate.",
          ],
        },
        {
          title: "Third-Party Payment Processors",
          body: [
            "Payments may be processed by third-party providers. Their processing timelines, card network rules, dispute workflows, and refund settlement times may apply.",
            "Refunds, if approved, may take several business days to appear depending on the payment method and processor.",
          ],
        },
        {
          title: "No Sensitive Information",
          body: [
            "Do not send full card numbers, bank passwords, government identifiers, or other sensitive personal data when requesting support.",
            "A receipt ID, transaction reference, account email, and brief issue summary should usually be enough to investigate a request.",
          ],
        },
        {
          title: "Policy Updates",
          body: [
            "This policy may be updated as pricing, plans, payment providers, and product features evolve.",
            "The effective date above will be revised when meaningful changes are made.",
          ],
        },
      ]}
    />
  );
}

