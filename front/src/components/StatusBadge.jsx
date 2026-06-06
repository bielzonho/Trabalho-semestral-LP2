import { STATUS_LABELS, STATUS_CORES } from '../api/api';

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  const cor = STATUS_CORES[status] || { bg: '#f0f0f0', text: '#333' };

  return (
    <span
      className="badge"
      style={{ background: cor.bg, color: cor.text }}
    >
      {label}
    </span>
  );
}
