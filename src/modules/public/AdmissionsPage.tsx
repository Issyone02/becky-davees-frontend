import { Link } from 'react-router-dom';
import { useBrandColor } from '../../hooks/useBrandColor';

export function AdmissionsPage() {
  const brandColor = useBrandColor();
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-extrabold">Admissions</h1>
      <section>
        <h2 className="text-xl font-bold mb-2">How to Apply</h2>
        <ol className="list-decimal ml-6 text-text-secondary space-y-1">
          <li>Obtain an application form from the school office or enquire via the Contact page.</li>
          <li>Submit the completed form with the applicant's birth certificate and previous report (if any).</li>
          <li>Attend an entrance assessment and informal interview with the applicant and a parent/guardian.</li>
          <li>On offer, complete registration and pay the prescribed fees to secure a place.</li>
        </ol>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-2">Requirements</h2>
        <ul className="list-disc ml-6 text-text-secondary space-y-1">
          <li>Completed application form</li>
          <li>Birth certificate or declaration of age</li>
          <li>Two passport photographs</li>
          <li>Most recent report card (for transfer students)</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-2">Fees</h2>
        <p className="text-text-secondary">Fee structures are published per class and term. Contact the school office for the current schedule.</p>
      </section>
      <div>
        <Link to="/contact" className="px-6 py-3 rounded-input text-white font-semibold inline-block" style={{ backgroundColor: brandColor }}>
          Enquire About Admission
        </Link>
      </div>
    </div>
  );
}