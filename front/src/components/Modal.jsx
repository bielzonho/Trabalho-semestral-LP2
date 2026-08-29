export default function Modal({ isOpen, onClose, title, children, actions }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {title && <h3>{title}</h3>}
        {children}
        {actions && <div className="modal-acoes">{actions}</div>}
      </div>
    </div>
  );
}
