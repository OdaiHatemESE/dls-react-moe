'use client';

import clsx from 'clsx';

// Helper component for info display
const InfoCard = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div className="p-4 bg-gray-50 rounded-lg">
    <div className="text-xs text-gray-500 mb-1 font-medium">{label}</div>
    <div className={clsx("text-sm text-gray-900 font-semibold", mono && "font-mono")}>{value}</div>
  </div>
);

export default InfoCard;
