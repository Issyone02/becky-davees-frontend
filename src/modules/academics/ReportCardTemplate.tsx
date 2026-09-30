import { ReportCardData } from '../../api/results';
import { assetUrl } from '../../utils/assetUrl';
const QUALITIES = ['Attentiveness', 'Cleanliness', 'Emotional Balance', 'Honesty', 'Leadership', 'Maturity', 'Politeness', 'Punctuality'];
const ACTIVITIES = ['Handwriting', 'Verbal Fluency', 'Debate/Quiz', 'Sports', 'Drawing & Painting', 'Musical Skills', 'Handling Tools'];
const RATING_COLS = [{ v: 'exc', l: 'Exc' }, { v: 'good', l: 'Good' }, { v: 'fair', l: 'Fair' }, { v: 'poor', l: 'Poor' }];

function ordinalTerm(name: string) {
  if (/first/i.test(name)) return '1ST';
  if (/second/i.test(name)) return '2ND';
  if (/third/i.test(name)) return '3RD';
  return name.toUpperCase();
}
function fmtDate(d: string | Date | null) {
  if (!d) return '______________';
  const dt = new Date(d);
  const day = dt.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix} ${dt.toLocaleString('en-GB', { month: 'long' })}, ${dt.getFullYear()}`;
}

function ConductGrid({ heading, columnLabel, items, conduct }: {
  heading: string; columnLabel: string; items: string[]; conduct: { item: string; rating: string }[];
}) {
  // Deduplicate: keep only the last rating for each item
  const ratingMap = new Map<string, string>();
  for (const c of conduct) {
    ratingMap.set(c.item, c.rating);
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="font-bold mb-1">{heading}</div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border border-black">
            <th className="border border-black px-1 py-0.5 text-left">{columnLabel}</th>
            {RATING_COLS.map((c) => <th key={c.v} className="border border-black px-1 py-0.5 w-9">{c.l}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const rating = ratingMap.get(item);
            return (
              <tr key={item}>
                <td className="border border-black px-1 py-0.5">{item}</td>
                {RATING_COLS.map((c) => (
                  <td key={c.v} className="border border-black px-1 py-0.5 text-center">{rating === c.v ? '✓' : ''}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ReportCardTemplate({ data }: { data: ReportCardData & any }) {
  const s = data.settings;
  const totalObtained = data.results.reduce((a: number, r: any) => a + r.totalScore, 0);
  const totalPossible = data.results.length * 100;
  const percentage = totalPossible ? Math.round((totalObtained / totalPossible) * 1000) / 10 : 0;
  const status = data.average >= 40 ? 'PASSED' : 'FAILED';
  const otherMap = new Map<string, Map<string, number>>();
  for (const o of data.otherTotals ?? []) {
    if (!otherMap.has(o.subjectId)) otherMap.set(o.subjectId, new Map());
    otherMap.get(o.subjectId)!.set(o.termId, o.totalScore);
  }
  const conduct = data.conduct ?? [];

  return (
    <div className="print-area bg-white text-black text-[12px] leading-tight p-6 max-w-4xl mx-auto border border-border">
      {/* Header */}
      <div className="relative text-center mb-2">
        {s?.logoUrl && (
          <img src={assetUrl(s.logoUrl)!} alt="School Logo"
            className="h-16 w-16 object-contain absolute left-0 top-0" />
        )}
        <div className="text-xl font-extrabold uppercase">{s?.schoolName ?? 'School Name'}</div>
        {s?.motto && <div className="italic">Motto: {s.motto}</div>}
        <div className="text-[11px]">
          {[s?.address, s?.phone, s?.email].filter(Boolean).join(' | ')}
        </div>
        <div className="font-bold mt-2 underline">CONTINUOUS ASSESSMENT REPORT</div>
        <div className="font-bold">{ordinalTerm(data.term.name)} TERM {data.term.session.name} SESSION</div>
      </div>

      {/* Student line */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2 font-semibold">
        <div>Name of Student: <span className="font-normal underline">{data.student.fullName}</span></div>
        <div>Class: <span className="font-normal underline">{data.student.class.name}{data.student.class.department ? ` (${data.student.class.department})` : ''}</span></div>
        <div>No in Class: <span className="font-normal underline">{data.noInClass}</span></div>
        <div>Position: <span className="font-normal underline">{data.position ?? '-'}</span></div>
      </div>

      {/* 1. Attendance */}
      <div className="font-bold mb-1">1. ATTENDANCE</div>
      <table className="w-full text-xs border-collapse mb-2">
        <tbody>
          <tr>
            <td className="border border-black px-1 py-0.5">No of times school opened</td>
            <td className="border border-black px-1 py-0.5 text-center">{data.attendance.opened}</td>
            <td className="border border-black px-1 py-0.5">No of times present</td>
            <td className="border border-black px-1 py-0.5 text-center">{data.attendance.present}</td>
            <td className="border border-black px-1 py-0.5">No of times punctual</td>
            <td className="border border-black px-1 py-0.5 text-center">{data.attendance.punctual}</td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-0.5">Beginning of Term</td>
            <td className="border border-black px-1 py-0.5" colSpan={2}>{fmtDate(data.term.startDate)}</td>
            <td className="border border-black px-1 py-0.5">End of Term</td>
            <td className="border border-black px-1 py-0.5" colSpan={2}>{fmtDate(data.term.endDate)}</td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-0.5">Beginning of Next Term</td>
            <td className="border border-black px-1 py-0.5" colSpan={5}>{fmtDate(data.nextTermStart)}</td>
          </tr>
        </tbody>
      </table>

      {/* 2 & 3. Conduct + Physical skills — always side by side, like the school template */}
      <div className="flex flex-row gap-3 mb-3">
        <ConductGrid
          heading="2. OBSERVATIONS ON CONDUCT"
          columnLabel="Qualities"
          items={QUALITIES}
          conduct={conduct.filter((c: any) => c.category === 'quality')}
        />
        <ConductGrid
          heading="3. PERFORMANCE IN PHYSICAL SKILLS"
          columnLabel="Activities"
          items={ACTIVITIES}
          conduct={conduct.filter((c: any) => c.category === 'activity')}
        />
      </div>

      {/* 4. Subjects */}
      <div className="font-bold mb-1">4. PERFORMANCE IN SUBJECTS</div>
      <table className="w-full text-xs border-collapse mb-2">
        <thead>
          <tr>
            <th className="border border-black px-1 py-0.5 text-left">SUBJECTS</th>
            <th className="border border-black px-1 py-0.5">CA(30)</th>
            <th className="border border-black px-1 py-0.5">Exam(70)</th>
            <th className="border border-black px-1 py-0.5">Total(100)</th>
            <th className="border border-black px-1 py-0.5">Position</th>
            {(data.otherTerms ?? []).map((t: any) => (
              <th key={t.id} className="border border-black px-1 py-0.5">{t.name}</th>
            ))}
            <th className="border border-black px-1 py-0.5 text-center">Remarks</th>
          </tr>
          <tr>
            <td className="border border-black px-1 py-0.5">Max. Obtainable</td>
            <td className="border border-black px-1 py-0.5 text-center">30</td>
            <td className="border border-black px-1 py-0.5 text-center">70</td>
            <td className="border border-black px-1 py-0.5 text-center">100</td>
            <td className="border border-black px-1 py-0.5"></td>
            {(data.otherTerms ?? []).map((t: any) => (
              <td key={t.id} className="border border-black px-1 py-0.5 text-center">100</td>
            ))}
            <td className="border border-black px-1 py-0.5"></td>
          </tr>
        </thead>
        <tbody>
          {data.results.map((r: any, i: number) => (
            <tr key={r.id}>
              <td className="border border-black px-1 py-0.5">{i + 1}. {r.subject.name}</td>
              <td className="border border-black px-1 py-0.5 text-center">{r.testScore}</td>
              <td className="border border-black px-1 py-0.5 text-center">{r.examScore}</td>
              <td className="border border-black px-1 py-0.5 text-center font-semibold">{r.totalScore}</td>
              <td className="border border-black px-1 py-0.5 text-center">{r.position ?? '-'}</td>
              {(data.otherTerms ?? []).map((t: any) => (
                <td key={t.id} className="border border-black px-1 py-0.5 text-center">
                  {otherMap.get(r.subjectId)?.get(t.id) ?? '-'}
                </td>
              ))}
              <td className="border border-black px-1 py-0.5 text-center">{r.remark ?? r.grade ?? '-'}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="border border-black px-1 py-0.5">TOTAL</td>
            <td className="border border-black px-1 py-0.5"></td>
            <td className="border border-black px-1 py-0.5"></td>
            <td className="border border-black px-1 py-0.5 text-center">{totalObtained}/{totalPossible}</td>
            <td className="border border-black px-1 py-0.5"></td>
            {(data.otherTerms ?? []).map((t: any) => <td key={t.id} className="border border-black px-1 py-0.5"></td>)}
            <td className="border border-black px-1 py-0.5 text-center">{data.grade ?? '-'}</td>
          </tr>
        </tbody>
      </table>
      <div className="flex flex-wrap gap-4 font-semibold mb-3">
        <span>Overall Total: {totalObtained}/{totalPossible}</span>
        <span>Overall Percentage: {percentage}%</span>
        <span>Grade: {data.grade ?? '-'}</span>
        <span>Status: {status}</span>
      </div>

      {/* 8. Health */}
      <div className="font-bold mb-1">8. HEALTH / PHYSICAL GROWTH</div>
      <div className="border border-black px-2 py-1 mb-3">
        General Comments on Health: {data.remarks?.healthComment || '________________'}
      </div>

      {/* General comments */}
      <div className="font-bold mb-1">GENERAL COMMENTS</div>
      <table className="w-full text-xs border-collapse mb-4">
        <tbody>
          <tr>
            <td className="border border-black px-1 py-1 w-40 font-semibold">Class Teacher's Comment{data.classTeacherName ? ` (${data.classTeacherName})` : ''}</td>
            <td className="border border-black px-1 py-1">{data.remarks?.teacherComment || ''}</td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-1 font-semibold">Head Teacher's Comments</td>
            <td className="border border-black px-1 py-1">{data.remarks?.headTeacherComment || ''}</td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-1 font-semibold">Parent's Comment</td>
            <td className="border border-black px-1 py-1">{data.remarks?.parentComment || ''}</td>
          </tr>
        </tbody>
      </table>
{/* Signatures */}
      <div className="grid grid-cols-3 gap-4 items-end text-[11px] mt-24">
        <div className="text-center">
          {data.signatures?.teacher
            ? <img src={assetUrl(data.signatures.teacher)!} alt="Class Teacher Signature"
                style={{ height: '7mm', width: 'auto', maxHeight: 'none', maxWidth: '100%', objectFit: 'contain' }}
                className="mx-auto mb-1" />
            : <div className="border-b border-black h-12"></div>}
          <div className="mt-1">Class Teacher's Signature &nbsp; Date: {fmtDate(new Date())}</div>
        </div>
        <div className="text-center">
          {data.signatures?.stamp
            ? <img src={assetUrl(data.signatures.stamp)!} alt="School Stamp"
                style={{ height: '40mm', width: 'auto', maxHeight: 'none', maxWidth: '100%', objectFit: 'contain' }}
                className="mx-auto" />
            : <div className="border border-dashed border-black h-16 flex items-center justify-center text-[10px]">Affix School Stamp &amp; Authorized Signature Here</div>}
        </div>
        <div className="text-center">
          {data.signatures?.headTeacher
            ? <img src={assetUrl(data.signatures.headTeacher)!} alt="Head Teacher Signature"
                style={{ height: '7mm', width: 'auto', maxHeight: 'none', maxWidth: '100%', objectFit: 'contain' }}
                className="mx-auto mb-1" />
            : <div className="border-b border-black h-12"></div>}
          <div className="mt-1">Head Teacher's Signature ({s?.headTeacherName ?? '____________'}) &nbsp; Date: {fmtDate(new Date())}</div>
        </div>
      </div>
    </div>
  );
}