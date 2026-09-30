import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';

const SCHOOL = 'Becky Davees Private School';
const UPDATED = '28 September 2026';

interface Section { h: string; p: string[] }

function LegalShell({ kind, title, intro, sections }: {
  kind: 'terms' | 'privacy'; title: string; intro: string; sections: Section[];
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* ---------- Left sidebar: identity + table of contents ---------- */}
        <aside className="md:sticky md:top-6 self-start space-y-4">
          <Link to="/register" className="flex items-center gap-2 font-extrabold text-text-primary">
            <span className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center font-black">S</span>
            SchoolMS
          </Link>
          <div>
            <div className="text-xs uppercase tracking-wide text-text-muted">{SCHOOL}</div>
            <h1 className="text-xl font-extrabold text-text-primary mt-1">{title}</h1>
            <div className="text-xs text-text-muted mt-1">Last updated: {UPDATED}</div>
          </div>
          <nav className="space-y-1 max-h-[46vh] overflow-y-auto pr-1 border-t border-border pt-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">On this page</div>
            {sections.map((s, i) => (
              <a key={s.h} href={`#${kind}-${i}`}
                className="block text-sm text-text-secondary hover:text-primary hover:underline py-0.5">
                {i + 1}. {s.h}
              </a>
            ))}
          </nav>
          <div className="text-sm space-y-1 border-t border-border pt-3">
            <div className="font-semibold text-text-primary mb-1">Also read</div>
            {kind === 'terms' ? (
              <Link to="/privacy" className="block text-primary hover:underline">Privacy Policy →</Link>
            ) : (
              <Link to="/terms" className="block text-primary hover:underline">Terms & Conditions →</Link>
            )}
            <Link to="/register" className="block text-text-secondary hover:underline">← Back to registration</Link>
            <Link to="/login" className="block text-text-secondary hover:underline">← Back to login</Link>
          </div>
          <div className="text-xs text-text-muted bg-surface border border-border rounded-input p-3">
            Questions or data-protection requests? Contact the School office in person, by phone,
            or via the official School email address.
          </div>
        </aside>

        {/* ---------- Document ---------- */}
        <main>
          <Card className="space-y-5">
            <p className="text-sm text-text-secondary">{intro}</p>
            {sections.map((s, i) => (
              <section key={s.h} id={`${kind}-${i}`} className="scroll-mt-6">
                <h2 className="font-bold text-text-primary mb-2">{i + 1}. {s.h}</h2>
                {s.p.map((para, j) => (
                  <p key={j} className="text-sm text-text-secondary mb-2">{para}</p>
                ))}
              </section>
            ))}
          </Card>
          <p className="text-xs text-text-muted text-center mt-4">
            These documents govern the SchoolMS portal operated by {SCHOOL}.
          </p>
        </main>
      </div>
    </div>
  );
}

/* ============ CONTENT (unchanged) ============ */

const TERMS: Section[] = [
  { h: 'Acceptance of Terms', p: [
    `By creating an account on or using the SchoolMS portal of ${SCHOOL} ("the School"), you agree to these Terms & Conditions. If you do not agree, do not register or use the portal.`,
    'The School may update these terms; continued use after an update constitutes acceptance. The "Last updated" date above always reflects the current version.',
  ]},
  { h: 'Accounts & Eligibility', p: [
    'Teacher and Parent/Guardian accounts may be registered; student records are created and managed by the School. Parents/guardians are responsible for accounts relating to minor students.',
    'You must provide accurate, current information, keep your credentials confidential, and promptly notify the School office of any suspected unauthorised use. One account per person; accounts are personal and non-transferable.',
    'All registrations are subject to verification and approval by the School. The School may refuse, suspend or deactivate accounts that breach these terms or cease to be associated with the School.',
  ]},
  { h: 'The Service', p: [
    'The portal provides school-administration functions including attendance registers, score entry and report cards, fee structures and receipts, timetables, announcements, feedback channels and account management.',
    'Official records are those stored in the portal. Printed or PDF outputs (report cards, receipts, result sheets) generated from the portal are valid School documents.',
  ]},
  { h: 'Acceptable Use', p: [
    'You agree not to: share credentials; impersonate others; upload unlawful, offensive or malicious content or files; attempt to access data you are not authorised to view; interfere with system security or integrity; or use the portal for any purpose unrelated to School business.',
    "Feedback and complaint channels must be used in good faith. Repeated misuse may lead to suspension of portal privileges without affecting the student's right to education.",
  ]},
  { h: 'Fees & Payments', p: [
    'Fee structures published per class and term in the portal are indicative; the bursary remains the authority on billing. Payments recorded in the portal generate official receipt numbers.',
    'Disputes about a payment must be raised with the School office within 30 days; voided payments retain a full audit trail.',
  ]},
  { h: 'Availability, Maintenance & Data Accuracy', p: [
    'The School strives for uninterrupted service but does not warrant that the portal will be error-free or always available; maintenance windows and outages may occur.',
    'Users are responsible for the accuracy of information they submit (scores within authorised roles, comments, contact details). The School may correct records where errors are identified, with corrections logged.',
  ]},
  { h: 'Suspension & Termination', p: [
    'The School may suspend or deactivate accounts immediately upon security concerns, misconduct, or termination of the relationship with the School (graduation, withdrawal, resignation).',
    'Academic and financial history of students is retained after account deactivation in line with the Privacy Policy and record-keeping obligations.',
  ]},
  { h: 'Intellectual Property', p: [
    'The portal software, design and School-published content remain the property of their respective owners. You receive a limited, revocable, non-exclusive licence to use the portal for its intended purpose.',
  ]},
  { h: 'Disclaimer & Limitation of Liability', p: [
    'To the maximum extent permitted by law, the School is not liable for indirect or consequential losses arising from use of, or inability to use, the portal, except where liability cannot be excluded by law.',
  ]},
  { h: 'Governing Law & Contact', p: [
    'These terms are governed by the laws of the Federal Republic of Nigeria. Questions: contact the School office in person, by phone, or via the official School email address.',
  ]},
];

const PRIVACY: Section[] = [
  { h: 'Overview & Data Controller', p: [
    `${SCHOOL} ("the School") is the data controller for personal information processed through this portal. We process personal data in accordance with the Nigeria Data Protection Act (NDPA) 2023 and applicable regulations.`,
  ]},
  { h: 'Information We Collect', p: [
    'Students: full name, student/admission numbers, date of birth, gender, class and session enrolments, attendance records, assessment scores and grades, conduct and health comments, report-card history, and fee/payment records.',
    'Parents/Guardians: full name, email address, phone number, relationship to student(s), account and communication records.',
    'Teachers/Staff: full name, email, phone, staff code, teaching assignments, class-teacher roles, uploaded signature, and work records such as entered scores and comments.',
    'Account & technical data: password (stored only as a secure hash), role, status, login timestamps and IP address, device/user-agent in audit logs, and session tokens.',
  ]},
  { h: 'How We Use Information', p: [
    'To operate the School: registration and enrolment, attendance safeguarding, assessment and report cards, fee billing and receipts, timetabling, official communication (in-app notices, email, optional SMS), feedback handling, and statutory record-keeping.',
    "Email/SMS notifications are sent for key events (payment confirmations, report-card publication, registration decisions, password resets, session notices). SMS is optional and controlled by the School's messaging settings.",
  ]},
  { h: 'Lawful Bases', p: [
    'Consent (given by a parent/guardian for minors) at registration; performance of the education contract between the School and the family or staff member; compliance with legal obligations (education and financial records); and the School\'s legitimate interests in safe, efficient administration.',
  ]},
  { h: 'Sharing & Processors', p: [
    'We do not sell personal data. Data is shared only with: authorised School staff according to role; service processors acting on our instructions (hosting providers, email delivery and SMS gateways); and authorities where legally required.',
    'Each processor is bound by confidentiality and security obligations consistent with the NDPA 2023.',
  ]},
  { h: 'Cookies & Local Storage', p: [
    'The portal uses essential storage: an httpOnly refresh-token cookie for secure sessions, and minimal browser local storage for interface preferences (such as role theme). No advertising or tracking cookies are used.',
  ]},
  { h: 'Retention', p: [
    'Academic transcripts, attendance and financial records are retained for the periods required by law and School policy, even after a student leaves or graduates, because they constitute official education records.',
    'When a teacher or parent account is deleted from the portal, it is deactivated and hidden from lists; underlying historical references (e.g. receipts, signed report cards, audit entries) are preserved for record integrity. Authentication sessions are terminated at deletion.',
  ]},
  { h: 'Security', p: [
    'Technical measures include encrypted connections (HTTPS), bcrypt password hashing, role-based access control, login rate-limiting and lockout, refresh-token rotation, immutable audit logging, time-boxed attendance edits and result locking.',
    'No system is absolutely secure; users must protect their credentials and report suspected incidents to the School office promptly.',
  ]},
  { h: 'Your Rights', p: [
    'Subject to legal retention rules, you may request access to, correction of, or deletion of personal data, object to certain processing, withdraw consent where processing is consent-based, and request a copy of data you provided.',
    'Requests are handled by the School office. You also have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC).',
  ]},
  { h: "Children's Data", p: [
    "Student data is processed under the authority and consent of parents/guardians and the School's duty of care. Students' portal-visible data is limited to their own records and their guardians' and teachers' authorised views.",
  ]},
  { h: 'International Transfers', p: [
    'Where processors host data outside Nigeria (e.g. cloud hosting or email delivery), the School relies on lawful transfer safeguards under the NDPA 2023, including contractual confidentiality and security requirements.',
  ]},
  { h: 'Changes & Contact', p: [
    'This policy may be updated; material changes will be announced via the portal. Data-protection contact: the School office (in person, phone, or official School email), quoting "Data Protection Request".',
  ]},
];

export function TermsPage() {
  return (
    <LegalShell kind="terms"
      title="Terms & Conditions"
      intro="These terms govern your registration and use of the SchoolMS portal, including the accounts of teachers, parents/guardians and the student records they manage."
      sections={TERMS}
    />
  );
}

export function PrivacyPage() {
  return (
    <LegalShell kind="privacy"
      title="Privacy Policy"
      intro="This policy explains what personal information the School collects through the portal, why we collect it, how we protect it, and the rights you have under the Nigeria Data Protection Act 2023."
      sections={PRIVACY}
    />
  );
}