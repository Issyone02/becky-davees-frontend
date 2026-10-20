import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function VerifyQR({ url, label = 'Scan to verify' }: { url: string; label?: string }) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 160 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [url]);

  if (!qr) return null;
  return (
    <div className="text-center shrink-0">
      <img src={qr} alt={label} className="h-20 w-20 mx-auto" />
      <div className="text-[9px] mt-0.5">{label}</div>
    </div>
  );
}