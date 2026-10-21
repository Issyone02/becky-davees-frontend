import { useBrandColor } from '../../hooks/useBrandColor';

export function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
  const brandColor = useBrandColor();
  return (
    <div className="px-4 py-12 text-center" style={{ background: `linear-gradient(135deg, ${brandColor}22, ${brandColor}06)` }}>
      <div className="max-w-3xl mx-auto">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-3" style={{ backgroundColor: brandColor }}>
          {title}
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary">{title}</h1>
        {subtitle && <p className="mt-2 text-text-secondary">{subtitle}</p>}
      </div>
    </div>
  );
}