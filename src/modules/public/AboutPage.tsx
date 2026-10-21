import { PageHero } from '../../components/public/PageHero';
import { useSchoolInfo } from '../../hooks/useSchoolInfo';

export function AboutPage() {
  const info = useSchoolInfo();
  return (
    <>
      <PageHero title="About Us" subtitle="Our story, vision and the values that guide us" />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="card space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-2">Who We Are</h2>
            <p className="text-text-secondary">
              {info?.schoolName ?? 'Our school'} is a co-educational institution committed to raising well-rounded,
              confident and morally grounded young people. Edit this paragraph in
              <code className="mx-1 bg-gray-100 px-1 rounded">AboutPage.tsx</code> to tell your school's own story.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">Our Vision</h2>
            <p className="text-text-secondary">To be a leading centre of learning where every child discovers and develops their God-given potential.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">Our Mission</h2>
            <p className="text-text-secondary">To provide a safe, stimulating and disciplined environment that nurtures academic excellence, character and service.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">Core Values</h2>
            <ul className="list-disc ml-6 text-text-secondary space-y-1">
              <li>Integrity and honesty</li>
              <li>Discipline and responsibility</li>
              <li>Respect for self and others</li>
              <li>Excellence in all endeavours</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}