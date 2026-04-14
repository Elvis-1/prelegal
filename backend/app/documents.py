"""
Document registry for all supported legal document types.
Each entry defines the fields the AI must collect and drives the system prompt.
"""
from dataclasses import dataclass, field
from typing import List


@dataclass
class FieldSpec:
    key: str
    label: str
    description: str
    default: str = ""
    optional: bool = False


@dataclass
class DocumentSpec:
    key: str
    name: str
    description: str
    fields: List[FieldSpec]

    def initial_fields(self) -> dict:
        return {f.key: f.default for f in self.fields}


def _party_fields(p1: str = "Party 1", p2: str = "Party 2") -> List[FieldSpec]:
    return [
        FieldSpec(f"party1_company", f"{p1} Company", f"{p1}'s company or organization name"),
        FieldSpec(f"party1_name", f"{p1} Signatory Name", f"Full name of the person signing for {p1}"),
        FieldSpec(f"party1_title", f"{p1} Signatory Title", f"Job title of the {p1} signatory"),
        FieldSpec(f"party1_noticeAddress", f"{p1} Notice Address", f"Address for legal notices to {p1}"),
        FieldSpec(f"party2_company", f"{p2} Company", f"{p2}'s company or organization name"),
        FieldSpec(f"party2_name", f"{p2} Signatory Name", f"Full name of the person signing for {p2}"),
        FieldSpec(f"party2_title", f"{p2} Signatory Title", f"Job title of the {p2} signatory"),
        FieldSpec(f"party2_noticeAddress", f"{p2} Notice Address", f"Address for legal notices to {p2}"),
    ]


def _common_fields() -> List[FieldSpec]:
    return [
        FieldSpec("effectiveDate", "Effective Date", "Agreement start date in YYYY-MM-DD format"),
        FieldSpec("governingLaw", "Governing Law", "US state whose laws govern the agreement, e.g. 'Delaware'"),
        FieldSpec("chosenCourts", "Chosen Courts", "City/county and state for dispute resolution, e.g. 'New Castle, DE'"),
    ]


REGISTRY: dict[str, DocumentSpec] = {
    "mutual-nda": DocumentSpec(
        key="mutual-nda",
        name="Mutual Non-Disclosure Agreement",
        description="Standard mutual NDA for sharing confidential information for a defined purpose. Covers use restrictions, exceptions, term, and governing law.",
        fields=[
            FieldSpec("purpose", "Purpose", 'What the confidential information will be used for, e.g. "evaluating a potential partnership"'),
            *_common_fields(),
            FieldSpec("mndaTermType", "MNDA Term Type", '"expires" for a fixed duration, or "continues" until terminated by either party', default="expires"),
            FieldSpec("mndaTermYears", "MNDA Term (years)", "Duration in years — only required when term type is 'expires'", default="1"),
            FieldSpec("confidentialityTermType", "Confidentiality Term Type", '"years" for time-limited, or "perpetuity" for indefinite', default="years"),
            FieldSpec("confidentialityTermYears", "Confidentiality Term (years)", "Duration of the confidentiality obligation — only required when not perpetuity", default="1"),
            FieldSpec("modifications", "Modifications", 'Any changes to the standard terms, or "None." if no modifications', default="None."),
            *_party_fields(),
        ],
    ),
    "csa": DocumentSpec(
        key="csa",
        name="Cloud Service Agreement",
        description="Comprehensive agreement for cloud-based SaaS products covering service access, payment, privacy, warranties, liability, and confidentiality.",
        fields=[
            *_common_fields(),
            FieldSpec("subscriptionPeriod", "Subscription Period", "Duration of the service subscription, e.g. '12 months' or '1 year'"),
            FieldSpec("orderDate", "Order Date", "Date the order form is signed (YYYY-MM-DD)"),
            FieldSpec("paymentProcess", "Payment Process", "How payment is made, e.g. 'monthly invoicing' or 'annual upfront charge'"),
            FieldSpec("generalCapAmount", "Liability Cap", "Maximum total liability, e.g. '12 months of fees paid'"),
            FieldSpec("technicalSupport", "Technical Support", "Support level included, e.g. 'business hours email support'"),
            FieldSpec("prohibitedData", "Prohibited Data", "Data types not allowed in the service, e.g. 'PHI, government classified data'. Use 'None' if no restrictions.", default="None", optional=True),
            *_party_fields("Provider", "Customer"),
        ],
    ),
    "design-partner": DocumentSpec(
        key="design-partner",
        name="Design Partner Agreement",
        description="Agreement for early-access design partner programs covering product access, feedback obligations, IP ownership, and confidentiality.",
        fields=[
            *_common_fields(),
            FieldSpec("program", "Program Description", "Description of the design partner program, e.g. 'beta access to the v2 platform'"),
            FieldSpec("productDescription", "Product Description", "What product the design partner is evaluating"),
            FieldSpec("term", "Agreement Term", "Duration of the agreement, e.g. '6 months'"),
            FieldSpec("fees", "Fees", "Amount the design partner pays, if any. Use 'None' if participation is free.", default="None"),
            *_party_fields("Provider", "Design Partner"),
        ],
    ),
    "sla": DocumentSpec(
        key="sla",
        name="Service Level Agreement",
        description="SLA defining uptime and response time targets, availability calculation, service credits, and termination rights.",
        fields=[
            *_common_fields(),
            FieldSpec("targetUptime", "Target Uptime", "Uptime commitment percentage, e.g. '99.9%'"),
            FieldSpec("targetResponseTime", "Target Response Time", "Support response time target, e.g. '24 business hours'"),
            FieldSpec("supportChannel", "Support Channel", "How support requests are submitted, e.g. 'email at support@example.com'"),
            FieldSpec("scheduledDowntime", "Scheduled Downtime", "Planned maintenance windows, e.g. 'Sundays 2-4am UTC'"),
            FieldSpec("uptimeCredit", "Uptime Credit Formula", "Service credit for uptime failures, e.g. '10% of monthly fees per 0.1% below target'"),
            *_party_fields("Provider", "Customer"),
        ],
    ),
    "psa": DocumentSpec(
        key="psa",
        name="Professional Services Agreement",
        description="Agreement governing professional services engagements including SOW-based delivery, IP assignment, payment, and confidentiality.",
        fields=[
            *_common_fields(),
            FieldSpec("deliverables", "Deliverables", "What will be produced or delivered under the agreement"),
            FieldSpec("fees", "Fees", "Payment amount and schedule, e.g. '$10,000 payable monthly'"),
            FieldSpec("paymentPeriod", "Payment Terms", "When invoices are due, e.g. 'Net 30'"),
            FieldSpec("sowTerm", "SOW Term", "Duration of the statement of work, e.g. '3 months'"),
            FieldSpec("generalCapAmount", "Liability Cap", "Maximum liability, e.g. 'fees paid in the prior 12 months'"),
            *_party_fields("Provider", "Customer"),
        ],
    ),
    "dpa": DocumentSpec(
        key="dpa",
        name="Data Processing Agreement",
        description="GDPR-compliant DPA covering processor/subprocessor relationships, processing instructions, restricted transfers, security incidents, and audit rights.",
        fields=[
            *_common_fields(),
            FieldSpec("categoriesOfPersonalData", "Categories of Personal Data", "Types of personal data processed, e.g. 'names, email addresses, usage logs'"),
            FieldSpec("categoriesOfDataSubjects", "Categories of Data Subjects", "Who the data subjects are, e.g. 'employees, end users of the customer'"),
            FieldSpec("purposeOfProcessing", "Purpose of Processing", "Why the data is being processed, e.g. 'providing cloud analytics services'"),
            FieldSpec("durationOfProcessing", "Duration of Processing", "How long data will be processed, e.g. 'duration of the service agreement'"),
            FieldSpec("approvedSubprocessors", "Approved Subprocessors", "List of approved subprocessors, or 'None' if none"),
            FieldSpec("governingMemberState", "Governing EU Member State", "EU member state governing the SCCs for GDPR transfers, e.g. 'Ireland'"),
            FieldSpec("securityPolicy", "Security Policy", "Provider's security standards or certifications, e.g. 'ISO 27001 certified'"),
            *_party_fields("Provider (Processor)", "Customer (Controller)"),
        ],
    ),
    "partnership": DocumentSpec(
        key="partnership",
        name="Partnership Agreement",
        description="Standard terms for business partnerships covering mutual obligations, trademark licensing, payment, confidentiality, and liability.",
        fields=[
            *_common_fields(),
            FieldSpec("obligations", "Partner Obligations", "What each party is obligated to do under the partnership"),
            FieldSpec("endDate", "End Date", "When the agreement expires (YYYY-MM-DD)"),
            FieldSpec("territory", "Territory", "Geographic scope of the trademark license, e.g. 'worldwide' or 'North America'"),
            FieldSpec("fees", "Fees", "Payment terms if fees are involved, or 'None' if no fees", default="None"),
            FieldSpec("generalCapAmount", "Liability Cap", "Maximum liability amount, e.g. 'fees paid in the prior 12 months'"),
            *_party_fields("Company", "Partner"),
        ],
    ),
    "software-license": DocumentSpec(
        key="software-license",
        name="Software License Agreement",
        description="Agreement for on-premise software licensing covering license grant, restrictions, payment, updates, warranties, and liability.",
        fields=[
            *_common_fields(),
            FieldSpec("subscriptionPeriod", "License Period", "Duration of the software license, e.g. '1 year' or 'perpetual'"),
            FieldSpec("permittedUses", "Permitted Uses", "What the software may be used for, e.g. 'internal business operations only'"),
            FieldSpec("licenseLimits", "License Limits", "User count, seat limits, or other restrictions, e.g. 'up to 50 named users'"),
            FieldSpec("paymentProcess", "Payment Process", "How and when payment is made"),
            FieldSpec("warrantyPeriod", "Warranty Period", "Duration of the software warranty, e.g. '90 days'"),
            FieldSpec("generalCapAmount", "Liability Cap", "Maximum liability amount"),
            *_party_fields("Provider", "Customer"),
        ],
    ),
    "pilot": DocumentSpec(
        key="pilot",
        name="Pilot Agreement",
        description="Short-term pilot/trial agreement for evaluating a product before a full commercial agreement, covering access, restrictions, and limited liability.",
        fields=[
            *_common_fields(),
            FieldSpec("pilotPeriod", "Pilot Period", "Duration of the pilot/trial, e.g. '90 days' or '3 months'"),
            FieldSpec("fees", "Fees", "Pilot fees if any, or 'None' if the pilot is free", default="None"),
            FieldSpec("generalCapAmount", "Liability Cap", "Maximum liability amount, e.g. '$10,000'"),
            *_party_fields("Provider", "Customer"),
        ],
    ),
    "baa": DocumentSpec(
        key="baa",
        name="Business Associate Agreement",
        description="HIPAA-compliant BAA governing Protected Health Information (PHI) handling, safeguards, breach notification, subcontractors, and audit rights.",
        fields=[
            *_common_fields(),
            FieldSpec("baaEffectiveDate", "BAA Effective Date", "When this BAA takes effect (YYYY-MM-DD)"),
            FieldSpec("agreement", "Base Agreement", "The service agreement this BAA supplements, e.g. 'Cloud Service Agreement dated January 1, 2026'"),
            FieldSpec("services", "Services Involving PHI", "Description of services that involve Protected Health Information"),
            FieldSpec("breachNotificationPeriod", "Breach Notification Period", "How quickly provider must report breaches, e.g. '72 hours'"),
            FieldSpec("limitations", "PHI Limitations", "Any restrictions on offshore processing or PHI use, or 'None'", default="None"),
            *_party_fields("Business Associate (Provider)", "Covered Entity"),
        ],
    ),
    "ai-addendum": DocumentSpec(
        key="ai-addendum",
        name="AI Addendum",
        description="Addendum covering AI/ML service usage, input/output ownership, model training restrictions, and AI-specific disclaimers.",
        fields=[
            *_common_fields(),
            FieldSpec("agreement", "Base Agreement", "The agreement this addendum supplements, e.g. 'Cloud Service Agreement dated January 1, 2026'"),
            FieldSpec("trainingRestrictions", "Training Restrictions", "Whether and how customer data may be used to train AI models, e.g. 'customer data may not be used for model training'"),
            FieldSpec("improvementRestrictions", "Improvement Restrictions", "Limits on using data for non-training product improvements, e.g. 'aggregated, anonymised usage data may be used to improve the service'"),
            *_party_fields("Provider", "Customer"),
        ],
    ),
}

SUPPORTED_NAMES = ", ".join(f'"{s.name}"' for s in REGISTRY.values())
