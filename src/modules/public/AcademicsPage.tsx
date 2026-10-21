export function PublicAcademicsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-extrabold">Academics</h1>
      <section>
        <h2 className="text-xl font-bold mb-2">Curriculum</h2>
        <p className="text-text-secondary">
          We follow a broad, balanced national curriculum from early years through senior secondary,
          enriched with continuous assessment each term and a comprehensive end-of-term report card.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-2">Classes & Streams</h2>
        <p className="text-text-secondary">Small class sizes ensure every learner receives individual attention from a dedicated class teacher.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-2">Assessment & Reporting</h2>
        <p className="text-text-secondary">
          Continuous Assessment (CA) and examinations combine into a termly report card covering academics,
          conduct and physical skills — each verifiable online via its QR code.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-2">Co-Curricular Activities</h2>
        <ul className="list-disc ml-6 text-text-secondary space-y-1">
          <li>Sports and physical education</li>
          <li>Debate, quiz and verbal fluency clubs</li>
          <li>Music, arts and drawing</li>
          <li>Leadership and citizenship programmes</li>
        </ul>
      </section>
    </div>
  );
}