import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  LoaderCircle,
  Search,
  X,
  CircleAlert,
  BookOpen,
} from "lucide-react";
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return <button className={`button ${variant} ${className}`} {...props} />;
}
export function ActionLink({
  to,
  children,
  secondary = false,
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={`button ${secondary ? "secondary" : "primary"}`} to={to}>
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function Card({ children }: { children: ReactNode }) {
  return <div className="panel">{children}</div>;
}
export function Field({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} {...props} />
    </label>
  );
}
export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} {...props}>
        {children}
      </select>
    </label>
  );
}
export function SearchField({
  value,
  onChange,
  label = "Pesquisar obras",
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="search-field">
      <Search size={19} />
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Título, autor ou universo…"
        {...props}
      />
    </div>
  );
}
export function EmptyState({
  title = "Ainda não há nada por aqui",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <BookOpen size={32} />
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
export function LoadingState() {
  return (
    <div className="inline" role="status">
      <LoaderCircle className="spinner" size={20} /> A carregar…
    </div>
  );
}
export function ErrorState({ children }: { children: ReactNode }) {
  return (
    <div className="notice error" role="alert">
      <CircleAlert size={20} />
      {children}
    </div>
  );
}
export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="pagination" aria-label="Paginação">
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Anterior
      </Button>
      <span aria-live="polite">
        {page} / {pages}
      </span>
      <Button
        variant="secondary"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Seguinte
      </Button>
    </nav>
  );
}
export function Dropdown({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="dropdown">
      <summary>{label}</summary>
      <div className="dropdown-content">{children}</div>
    </details>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-head">
        <h2 id={id}>{title}</h2>
        <Button variant="ghost" aria-label="Fechar janela" onClick={onClose}>
          <X size={20} />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirmation({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Confirmar ação de demonstração">
      <p>Esta ação apenas mostra uma notificação. Nenhum dado será enviado.</p>
      <div className="actions">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Confirmar
        </Button>
      </div>
    </Modal>
  );
}
