import { useEffect, useId, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Eye, EyeOff, LogOut, UserRound } from "lucide-react";
import { Button, ErrorState, LoadingState } from "../../components/ui";
import { useAuth } from "./AuthProvider";
import { safeDestination } from "./security";
import { useToast } from "../../app/providers";
export function AuthFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="auth-card">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p className="auth-description">{description}</p>
      <AuthNotice />
      {children}
    </section>
  );
}
export function AuthNotice() {
  const { state, actions } = useAuth();
  if (state.status === "initializing")
    return (
      <div className="auth-status">
        <LoadingState />
      </div>
    );
  if (state.status === "configuration-error")
    return (
      <div className="notice" role="status">
        <strong>Autenticação indisponível</strong>
        <p>{state.error} Nenhuma conta ou sessão será simulada.</p>
      </div>
    );
  if (state.status === "operational-error" && state.callback !== "error")
    return (
      <div className="auth-status">
        <ErrorState>{state.error}</ErrorState>
        <Button
          variant="ghost"
          disabled={state.busy}
          onClick={() => void actions?.retry()}
        >
          Verificar sessão novamente
        </Button>
      </div>
    );
  return null;
}
export function PasswordField({
  label,
  value,
  onChange,
  confirmation = false,
  newPassword = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  confirmation?: boolean;
  newPassword?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className="field password-field">
      <label htmlFor={id}>{label}</label>
      <span className="password-input">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={
            newPassword || confirmation ? "new-password" : "current-password"
          }
          required
          disabled={disabled}
          minLength={newPassword ? 8 : undefined}
          maxLength={newPassword ? 128 : undefined}
        />
        <button
          type="button"
          aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLocaleLowerCase("pt")}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          disabled={disabled}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </div>
  );
}
export function useAuthCooldown() {
  const { state } = useAuth();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (state.resendAt <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state.resendAt]);
  return Math.max(0, Math.ceil((state.resendAt - now) / 1000));
}
export function SessionReady({
  destination = "/catalogo",
}: {
  destination?: string;
}) {
  const { state } = useAuth();
  return (
    <div className="auth-success">
      <UserRound size={27} />
      <h2>A tua sessão está ativa.</h2>
      <p>Podes continuar a descobrir histórias ou consultar a tua conta.</p>
      <Link className="button primary" to={safeDestination(destination)}>
        Continuar →
      </Link>
      <Link className="text-link" to="/definicoes">
        Ir para a conta →
      </Link>
      {state.user?.email && <small>{state.user.email}</small>}
    </div>
  );
}
export function AuthHeaderLinks({ mobile = false }: { mobile?: boolean }) {
  const { state, actions } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const destination = safeDestination(
    location.pathname + location.search + location.hash,
  );
  if (state.status === "initializing")
    return (
      <span className="auth-header-state" role="status">
        A recuperar sessão…
      </span>
    );
  if (state.status === "authenticated")
    return (
      <div className={mobile ? "auth-mobile-links" : "auth-desktop-links"}>
        <Link className="auth-account-link" to="/definicoes">
          <UserRound size={15} />
          Conta
        </Link>
        <Button
          variant="ghost"
          disabled={state.busy}
          onClick={async () => {
            const result = await actions?.signOut();
            if (result?.ok) toast("Sessão terminada.");
            else if (result) toast(result.message);
          }}
          aria-label="Terminar sessão"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </Button>
      </div>
    );
  return (
    <div className={mobile ? "auth-mobile-links" : "auth-desktop-links"}>
      {state.status === "operational-error" && state.session ? (
        <Link className="auth-account-link" to="/entrar">
          Verificar sessão
        </Link>
      ) : (
        <>
          <Link
            className="auth-account-link"
            to={`/entrar?next=${encodeURIComponent(destination)}`}
          >
            Entrar
          </Link>
          <Link
            className="auth-account-link auth-register-link"
            to={`/registar?next=${encodeURIComponent(destination)}`}
          >
            Registar
          </Link>
        </>
      )}
    </div>
  );
}
