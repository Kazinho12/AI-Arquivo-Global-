import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { Button, ErrorState, Field } from "../components/ui";
import { useAuth } from "../features/auth/AuthProvider";
import {
  AuthFrame,
  PasswordField,
  SessionReady,
  useAuthCooldown,
} from "../features/auth/components";
import { safeDestination } from "../features/auth/security";
import type { AuthResult } from "../features/auth/controller";
function useFormAction() {
  const [error, setError] = useState("");
  const lock = useRef(false);
  return {
    error,
    submit: async (event: FormEvent, action: () => Promise<void>) => {
      event.preventDefault();
      if (lock.current) return;
      lock.current = true;
      setError("");
      try {
        await action();
      } catch {
        setError("Não foi possível concluir o pedido. Tenta novamente.");
      } finally {
        lock.current = false;
      }
    },
    accept: (result: AuthResult | undefined) => {
      if (!result) {
        setError("Autenticação indisponível.");
        return false;
      }
      if (!result.ok) {
        setError(result.message);
        return false;
      }
      return true;
    },
  };
}
function FormError({ error }: { error: string }) {
  return error ? <ErrorState>{error}</ErrorState> : null;
}
function AuthSubmit({
  children,
  disabled = false,
}: {
  children: string;
  disabled?: boolean;
}) {
  const { state } = useAuth();
  return (
    <Button
      type="submit"
      disabled={
        disabled ||
        state.busy ||
        ["initializing", "configuration-error"].includes(state.status)
      }
    >
      {state.busy ? "A processar…" : children}
    </Button>
  );
}
function EmailField({
  value,
  onChange,
}: {
  value: string;
  onChange: (email: string) => void;
}) {
  return (
    <Field
      label="E-mail"
      type="email"
      autoComplete="email"
      required
      maxLength={254}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="o.teu@email.com"
    />
  );
}
export function LoginPage() {
  const { state, actions } = useAuth();
  const [params] = useSearchParams();
  const next = safeDestination(params.get("next"));
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const form = useFormAction();
  return (
    <AuthFrame
      eyebrow="VOLTA AO TEU UNIVERSO"
      title="É bom ter-te por aqui."
      description="Inicia sessão para continuares o teu percurso no Arquivo Global."
    >
      {state.status === "authenticated" ? (
        <SessionReady destination={next} />
      ) : (
        <>
          <form
            className="auth-form"
            aria-busy={state.busy}
            onSubmit={(e) =>
              form.submit(e, async () => {
                const result = await actions?.signIn(email, password);
                if (form.accept(result)) {
                  setPassword("");
                  navigate(next, { replace: true });
                }
              })
            }
          >
            <EmailField value={email} onChange={setEmail} />
            <PasswordField
              label="Senha"
              value={password}
              onChange={setPassword}
            />
            <Link
              className="text-link auth-recovery-link"
              to="/recuperar-senha"
            >
              Esqueceste-te da senha?
            </Link>
            <FormError error={form.error} />
            <AuthSubmit>Entrar</AuthSubmit>
          </form>
          <div className="auth-divider">
            <span>ou continua com</span>
          </div>
          <Button
            className="google-button"
            variant="secondary"
            disabled={
              state.busy ||
              state.status === "initializing" ||
              state.status === "configuration-error"
            }
            onClick={(e) =>
              form.submit(e, async () => {
                form.accept(await actions?.google(next));
              })
            }
          >
            <span aria-hidden="true" className="google-mark">
              G
            </span>
            Continuar com Google
          </Button>
          <p className="auth-hint">
            O acesso Google depende da ativação do fornecedor no Supabase.
          </p>
          <p className="auth-switch">
            Ainda não tens conta?{" "}
            <Link to={`/registar?next=${encodeURIComponent(next)}`}>
              Criar conta
            </Link>
          </p>
        </>
      )}
    </AuthFrame>
  );
}
export function RegisterPage() {
  const { state, actions } = useAuth();
  const [params] = useSearchParams();
  const next = safeDestination(params.get("next"));
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const form = useFormAction();
  return (
    <AuthFrame
      eyebrow="A TUA HISTÓRIA COMEÇA AQUI"
      title="Um lugar para a tua imaginação."
      description="Cria uma conta gratuita com o teu e-mail. Não precisamos de outros dados pessoais."
    >
      {state.status === "authenticated" ? (
        <SessionReady destination={`/boas-vindas`} />
      ) : pending ? (
        <div className="auth-success" role="status">
          <Mail size={30} />
          <h2>Verifica a tua caixa de entrada.</h2>
          <p>
            O serviço recebeu o pedido. Se o endereço puder ser registado,
            receberás instruções para confirmar o e-mail. O envio e a chegada da
            mensagem podem demorar.
          </p>
          <Link className="button secondary" to="/confirmar-email">
            Confirmação e reenvio
          </Link>
          <Link className="text-link" to="/entrar">
            Voltar à entrada →
          </Link>
        </div>
      ) : (
        <form
          className="auth-form"
          aria-busy={state.busy}
          onSubmit={(e) =>
            form.submit(e, async () => {
              const result = await actions?.signUp(
                email,
                password,
                confirmation,
                next,
              );
              if (form.accept(result)) {
                setPassword("");
                setConfirmation("");
                if (result?.ok && result.kind === "authenticated")
                  navigate(`/boas-vindas?next=${encodeURIComponent(next)}`, {
                    replace: true,
                  });
                else setPending(true);
              }
            })
          }
        >
          <EmailField value={email} onChange={setEmail} />
          <PasswordField
            label="Senha"
            value={password}
            onChange={setPassword}
            newPassword
          />
          <PasswordField
            label="Confirmar senha"
            value={confirmation}
            onChange={setConfirmation}
            confirmation
          />
          <p className="auth-hint">
            Entre 8 e 128 caracteres, com pelo menos uma letra e um número. O
            serviço pode exigir requisitos adicionais.
          </p>
          <div className="auth-note">
            <ShieldCheck size={18} />
            <p>
              A confirmação por e-mail será necessária se estiver ativa no
              projeto Supabase.
            </p>
          </div>
          <FormError error={form.error} />
          <AuthSubmit>Criar conta</AuthSubmit>
          <p className="auth-hint">
            Consulta as <Link to="/regras">regras da comunidade</Link> e a{" "}
            <Link to="/privacidade">privacidade</Link> antes de continuares.
          </p>
          <p className="auth-switch">
            Já tens conta?{" "}
            <Link to={`/entrar?next=${encodeURIComponent(next)}`}>
              Iniciar sessão
            </Link>
          </p>
        </form>
      )}
    </AuthFrame>
  );
}
export function RecoverPage() {
  const { state, actions } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const cooldown = useAuthCooldown();
  const form = useFormAction();
  return (
    <AuthFrame
      eyebrow="RETOMA O TEU CAMINHO"
      title="Recuperar acesso."
      description="Indica o teu e-mail para solicitar um link de recuperação de senha."
    >
      {sent && (
        <div className="auth-inline-success" role="status">
          <CheckCircle2 size={20} />
          <p>
            Se existir uma conta elegível para este e-mail, receberás instruções
            de recuperação. Verifica também a pasta de spam.
          </p>
        </div>
      )}
      <form
        className="auth-form"
        aria-busy={state.busy}
        onSubmit={(e) =>
          form.submit(e, async () => {
            if (form.accept(await actions?.recover(email))) setSent(true);
          })
        }
      >
        <EmailField value={email} onChange={setEmail} />
        <FormError error={form.error} />
        <AuthSubmit disabled={cooldown > 0}>
          {cooldown > 0
            ? `Novo pedido em ${cooldown}s`
            : "Enviar link de recuperação"}
        </AuthSubmit>
        <p className="auth-hint">
          Por segurança, esta página não confirma a existência de uma conta.
          Abre o link no mesmo navegador onde fizeste o pedido.
        </p>
      </form>
      <p className="auth-switch">
        <Link to="/entrar">← Voltar à entrada</Link>
      </p>
    </AuthFrame>
  );
}
export function ResetPage() {
  const { state, actions } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [done, setDone] = useState(false);
  const form = useFormAction();
  const ready =
    state.status === "authenticated" &&
    Boolean(state.session) &&
    state.callback !== "error";
  return (
    <AuthFrame
      eyebrow="UM NOVO COMEÇO"
      title="Define uma nova senha."
      description="Usa o link enviado por e-mail ou uma sessão válida para atualizar a tua senha."
    >
      {done ? (
        <div className="auth-success" role="status">
          <CheckCircle2 size={32} />
          <h2>Senha atualizada.</h2>
          <p>
            O serviço confirmou a alteração. Poderá ser necessário iniciar
            sessão novamente.
          </p>
          <Link className="button primary" to="/catalogo">
            Continuar a explorar →
          </Link>
        </div>
      ) : state.callback === "error" ? (
        <>
          <ErrorState>
            {state.error ??
              "Este link é inválido ou expirou. Solicita um novo link."}
          </ErrorState>
          <Link className="button secondary" to="/recuperar-senha">
            Pedir novo link
          </Link>
        </>
      ) : (
        <>
          <form
            className="auth-form"
            aria-busy={state.busy}
            onSubmit={(e) =>
              form.submit(e, async () => {
                if (
                  form.accept(
                    await actions?.updatePassword(password, confirmation),
                  )
                ) {
                  setDone(true);
                  setPassword("");
                  setConfirmation("");
                }
              })
            }
          >
            <PasswordField
              label="Nova senha"
              value={password}
              onChange={setPassword}
              newPassword
              disabled={!ready}
            />
            <PasswordField
              label="Confirmar nova senha"
              value={confirmation}
              onChange={setConfirmation}
              confirmation
              disabled={!ready}
            />
            <p className="auth-hint">
              Usa entre 8 e 128 caracteres, incluindo uma letra e um número.
            </p>
            <FormError error={form.error} />
            <AuthSubmit disabled={!ready}>Guardar nova senha</AuthSubmit>
          </form>
          {!ready && state.status !== "initializing" && (
            <p className="auth-hint">
              É necessária uma sessão válida.{" "}
              <Link to="/recuperar-senha">Solicita um link de recuperação</Link>{" "}
              ou <Link to="/entrar?next=%2Fcatalogo">inicia sessão</Link>.
            </p>
          )}
        </>
      )}
    </AuthFrame>
  );
}
export function ConfirmEmailPage() {
  const { state, actions } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const cooldown = useAuthCooldown();
  const form = useFormAction();
  const confirmed =
    state.status === "authenticated" &&
    (state.callback === "confirmed" || Boolean(state.user?.email_confirmed_at));
  const oauth = state.callback === "oauth" && state.status === "authenticated";
  return (
    <AuthFrame
      eyebrow="CONFIRMAÇÃO DE E-MAIL"
      title={oauth ? "A tua sessão está pronta." : "Mais um passo para entrar."}
      description="Aqui podes acompanhar a confirmação do teu e-mail e solicitar novas instruções."
    >
      {state.callback === "error" ? (
        <ErrorState>
          {state.error ??
            "Não foi possível validar este link. Solicita um novo e-mail."}
        </ErrorState>
      ) : confirmed || oauth ? (
        <div className="auth-success" role="status">
          <CheckCircle2 size={32} />
          <h2>{oauth ? "Sessão iniciada." : "E-mail confirmado."}</h2>
          <p>
            {oauth
              ? "O serviço confirmou o início da sessão."
              : "O e-mail associado à tua sessão está confirmado pelo serviço."}
          </p>
          <Link
            className="button primary"
            to={safeDestination(state.destination)}
          >
            Continuar →
          </Link>
          <Link className="text-link" to="/boas-vindas">
            Conhecer o Arquivo Global →
          </Link>
        </div>
      ) : (
        <div className="auth-note">
          <Mail size={20} />
          <p>
            Abre o link da mensagem recebida para confirmar o e-mail. Visitar
            esta página, por si só, não confirma uma conta.
          </p>
        </div>
      )}
      {!confirmed && !oauth && (
        <form
          className="auth-form auth-resend"
          aria-busy={state.busy}
          onSubmit={(e) =>
            form.submit(e, async () => {
              if (form.accept(await actions?.resend(email))) setSent(true);
            })
          }
        >
          <EmailField value={email} onChange={setEmail} />
          {sent && (
            <p role="status">
              Se o endereço for elegível, receberás novas instruções. Verifica a
              caixa de entrada e o spam.
            </p>
          )}
          <FormError error={form.error} />
          <AuthSubmit disabled={cooldown > 0}>
            {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar confirmação"}
          </AuthSubmit>
          <p className="auth-hint">
            Aguarda pelo menos um minuto entre pedidos. Aplicam-se também os
            limites do serviço.
          </p>
        </form>
      )}
      <p className="auth-switch">
        <Link to="/entrar">Voltar à entrada</Link>
      </p>
    </AuthFrame>
  );
}
export function WelcomePage() {
  const { state } = useAuth();
  const [params] = useSearchParams();
  const next = safeDestination(params.get("next"));
  return (
    <AuthFrame
      eyebrow="BEM-VINDO AO ARQUIVO GLOBAL"
      title="O teu próximo capítulo começa aqui."
      description="Um espaço aberto para descobrir histórias e dar lugar à imaginação."
    >
      {state.status === "authenticated" ? (
        <>
          <div className="auth-inline-success" role="status">
            <CheckCircle2 size={20} />
            <p>A tua sessão está ativa. Já podes explorar o Arquivo Global.</p>
          </div>
          <div className="welcome-paths">
            <Link to={next}>
              <strong>Encontrar uma história</strong>
              <span>Explora o catálogo e as seleções de demonstração. →</span>
            </Link>
            <Link to="/categorias">
              <strong>Escolher um caminho</strong>
              <span>Descobre formatos literários e narrativas visuais. →</span>
            </Link>
            <Link to="/definicoes">
              <strong>Consultar a tua conta</strong>
              <span>A área de conta está preparada para etapas futuras. →</span>
            </Link>
          </div>
          <p className="auth-hint">
            Perfis completos, biblioteca e publicação ainda não estão
            disponíveis.
          </p>
        </>
      ) : (
        state.status !== "initializing" && (
          <div className="auth-success">
            <Mail size={28} />
            <h2>Continua quando estiveres pronto.</h2>
            <p>
              Esta página não confirma um registo. Confirma o teu e-mail ou
              inicia sessão para continuar.
            </p>
            <Link className="button primary" to="/entrar">
              Iniciar sessão
            </Link>
            <Link className="text-link" to="/confirmar-email">
              Ver confirmação de e-mail →
            </Link>
          </div>
        )
      )}
    </AuthFrame>
  );
}
