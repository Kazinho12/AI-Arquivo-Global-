import { useCanonicalProfile } from "../features/profile/cache";
import {
  usePreferences,
  updateReadingPreferences,
  updateAccessibility,
  preferenceOriginals,
} from "../features/preferences/store";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sun,
  Moon,
  Shield,
  Eye,
  Sliders,
  Type,
  UserRound,
  LogOut,
  Mail,
  CheckCircle2,
  CircleAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";
import { useTheme } from "../app/providers";
import { Button, ActionLink } from "../components/ui";

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  const maskedName =
    name.length <= 2
      ? name[0] + "***"
      : name[0] + "***" + name[name.length - 1];
  return `${maskedName}@${domain}`;
}

export function SettingsOverviewPage() {
  const { state: authState, actions } = useAuth();
  const { theme } = useTheme();

  const isAuth = authState.status === "authenticated" && authState.user;
  const profile = useCanonicalProfile(isAuth ? authState.user?.id : undefined);
  const username = profile?.username;
  const displayName = profile?.displayName ?? "A tua conta";

  return (
    <section className="settings-page">
      <div className="settings-header">
        <span className="eyebrow">A TUA CONTA</span>
        <h1>Definições e preferências</h1>
        <p>
          Gere a tua conta, preferências de leitura e as opções da plataforma.
        </p>
      </div>

      <div className="settings-card account-summary-card">
        <div className="account-summary-top">
          <div className="account-avatar">
            <UserRound size={28} />
          </div>
          <div className="account-summary-info">
            {isAuth ? (
              <>
                <h2>{displayName}</h2>
                <p className="account-meta">
                  <span>
                    {username ? `@${username}` : "Perfil por configurar"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{maskEmail(authState.user?.email || "")}</span>
                </p>
              </>
            ) : (
              <>
                <h2>Sessão não iniciada</h2>
                <p className="account-meta">
                  Estás a navegar como visitante público.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="account-summary-actions">
          {isAuth ? (
            <>
              <Link to="/perfil/editar" className="button secondary">
                Editar perfil público
              </Link>
              {username && (
                <Link to={`/utilizadores/${username}`} className="button ghost">
                  Ver perfil público →
                </Link>
              )}
            </>
          ) : (
            <ActionLink to="/entrar?next=/definicoes">
              Iniciar sessão
            </ActionLink>
          )}
        </div>
      </div>

      <div className="settings-grid">
        <Link to="/definicoes/aparencia" className="settings-nav-card">
          <div className="settings-icon">
            {theme === "dark" ? <Moon size={22} /> : <Sun size={22} />}
          </div>
          <div>
            <h3>Aparência</h3>
            <p>
              Tema visual ativo:{" "}
              <strong>{theme === "dark" ? "Escuro" : "Claro"}</strong>.
            </p>
          </div>
          <ArrowRight size={18} className="settings-arrow" />
        </Link>

        <Link to="/definicoes/leitura" className="settings-nav-card">
          <div className="settings-icon">
            <Type size={22} />
          </div>
          <div>
            <h3>Preferências de leitura</h3>
            <p>Tipografia, tamanho de fonte e largura do leitor.</p>
          </div>
          <ArrowRight size={18} className="settings-arrow" />
        </Link>

        <Link to="/definicoes/seguranca" className="settings-nav-card">
          <div className="settings-icon">
            <Shield size={22} />
          </div>
          <div>
            <h3>Segurança e conta</h3>
            <p>Gestão de sessão, recuperação de senha e credenciais.</p>
          </div>
          <ArrowRight size={18} className="settings-arrow" />
        </Link>

        <Link to="/definicoes/privacidade" className="settings-nav-card">
          <div className="settings-icon">
            <Eye size={22} />
          </div>
          <div>
            <h3>Privacidade</h3>
            <p>Controlo de visibilidade pública das tuas obras e dados.</p>
          </div>
          <ArrowRight size={18} className="settings-arrow" />
        </Link>

        <Link to="/definicoes/acessibilidade" className="settings-nav-card">
          <div className="settings-icon">
            <Sliders size={22} />
          </div>
          <div>
            <h3>Acessibilidade</h3>
            <p>Redução de movimento e contraste da interface.</p>
          </div>
          <ArrowRight size={18} className="settings-arrow" />
        </Link>
      </div>
    </section>
  );
}

export function SettingsAppearancePage() {
  const { theme, toggle } = useTheme();

  return (
    <section className="settings-page">
      <div className="settings-header">
        <span className="eyebrow">DEFINIÇÕES</span>
        <h1>Aparência da interface</h1>
        <p>
          Escolhe o tema visual que melhor se adapta ao teu ambiente de leitura.
        </p>
      </div>

      <div className="theme-selector-grid">
        <button
          type="button"
          onClick={() => {
            if (theme !== "dark") toggle();
          }}
          className={`theme-option-card ${theme === "dark" ? "active" : ""}`}
        >
          <div className="theme-preview dark-preview">
            <span className="preview-dot" />
            <div className="preview-line" />
            <div className="preview-line short" />
          </div>
          <div className="theme-title-row">
            <Moon size={18} />
            <strong>Tema Escuro</strong>
          </div>
          <p>
            Fundo azul profundo com texto claro, ideal para leitura noturna.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            if (theme !== "light") toggle();
          }}
          className={`theme-option-card ${theme === "light" ? "active" : ""}`}
        >
          <div className="theme-preview light-preview">
            <span className="preview-dot" />
            <div className="preview-line" />
            <div className="preview-line short" />
          </div>
          <div className="theme-title-row">
            <Sun size={18} />
            <strong>Tema Claro</strong>
          </div>
          <p>
            Fundo suave com tipografia de alto contraste para ambientes
            iluminados.
          </p>
        </button>
      </div>
    </section>
  );
}

export function SettingsReadingPage() {
  const preferences = usePreferences();
  const { fontSize, measure, fontFamily } = preferences.global;
  const handleFontSizeChange = (fontSize: "normal" | "medium" | "large") =>
    updateReadingPreferences({ fontSize });
  const handleMeasureChange = (measure: "comfortable" | "wide") =>
    updateReadingPreferences({ measure });
  const handleFontFamilyChange = (fontFamily: "serif" | "sans") =>
    updateReadingPreferences({ fontFamily });
  const sampleSizeClass =
    fontSize === "large"
      ? "text-lg"
      : fontSize === "medium"
        ? "text-base"
        : "text-sm";
  const sampleFontClass = fontFamily === "serif" ? "font-serif" : "font-sans";
  const sampleMeasureClass = measure === "wide" ? "max-w-3xl" : "max-w-xl";

  return (
    <section className="settings-page">
      <div className="settings-header">
        <span className="eyebrow">DEFINIÇÕES</span>
        <h1>Preferências de leitura</h1>
        <PreferenceRecovery />
        <p>Personaliza a tipografia e o espaçamento para o modo de leitura.</p>
      </div>

      <div className="settings-card">
        <h3>Tamanho do texto</h3>
        <p className="card-desc">
          Ajusta o corpo do texto nos capítulos literários.
        </p>
        <div className="choice-buttons">
          <Button
            variant={fontSize === "normal" ? "primary" : "secondary"}
            onClick={() => handleFontSizeChange("normal")}
          >
            Normal
          </Button>
          <Button
            variant={fontSize === "medium" ? "primary" : "secondary"}
            onClick={() => handleFontSizeChange("medium")}
          >
            Médio
          </Button>
          <Button
            variant={fontSize === "large" ? "primary" : "secondary"}
            onClick={() => handleFontSizeChange("large")}
          >
            Grande
          </Button>
        </div>
      </div>

      <div className="settings-card">
        <h3>Família de fonte</h3>
        <p className="card-desc">
          Opta por uma fonte clássica literária ou moderna sem serifa.
        </p>
        <div className="choice-buttons">
          <Button
            variant={fontFamily === "serif" ? "primary" : "secondary"}
            onClick={() => handleFontFamilyChange("serif")}
          >
            Serifada (Georgia)
          </Button>
          <Button
            variant={fontFamily === "sans" ? "primary" : "secondary"}
            onClick={() => handleFontFamilyChange("sans")}
          >
            Sem serifa (Inter)
          </Button>
        </div>
      </div>

      <div className="settings-card">
        <h3>Largura de linha</h3>
        <p className="card-desc">
          Controla o comprimento da linha de leitura para maior conforto ocular.
        </p>
        <div className="choice-buttons">
          <Button
            variant={measure === "comfortable" ? "primary" : "secondary"}
            onClick={() => handleMeasureChange("comfortable")}
          >
            Confortável (65 caracteres)
          </Button>
          <Button
            variant={measure === "wide" ? "primary" : "secondary"}
            onClick={() => handleMeasureChange("wide")}
          >
            Ampla (80 caracteres)
          </Button>
        </div>
      </div>

      <div className="settings-card preview-card">
        <h3>Demonstração em tempo real</h3>
        <div
          className={`sample-text-box ${sampleSizeClass} ${sampleFontClass} ${sampleMeasureClass}`}
        >
          <p>
            "A maré recuava devagar, desvelando os contornos de uma ilha de que
            nenhum navegador moderno alguma vez ouvira falar. O papel húmido do
            mapa ganhava transparência à luz do entardecer."
          </p>
        </div>
      </div>
    </section>
  );
}

export function SettingsSecurityPage() {
  const { state: authState, actions } = useAuth();
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const isAuth = authState.status === "authenticated" && authState.user;

  const handleRequestPasswordReset = async () => {
    if (!authState.user?.email || !actions) return;
    setSendingReset(true);
    setResetError(null);
    setResetSent(false);

    const result = await actions.recover(authState.user.email);
    setSendingReset(false);

    if (result.ok) {
      setResetSent(true);
    } else {
      setResetError(result.message);
    }
  };

  return (
    <section className="settings-page">
      <div className="settings-header">
        <span className="eyebrow">DEFINIÇÕES</span>
        <h1>Segurança e conta</h1>
        <p>Gere as credenciais da tua conta e a sessão ativa.</p>
      </div>

      {isAuth ? (
        <>
          <div className="settings-card">
            <h3>Sessão iniciada</h3>
            <p className="card-desc">
              A tua sessão encontra-se validada pelo serviço de autenticação
              Supabase.
            </p>
            <div className="user-email-row">
              <Mail size={16} />
              <span>{authState.user?.email || "Sessão ativa"}</span>
            </div>
          </div>

          <div className="settings-card">
            <h3>Redefinição de senha</h3>
            <p className="card-desc">
              Podes solicitar um link seguro para o teu e-mail para atualizar a
              tua senha de acesso.
            </p>

            {resetSent && (
              <div className="notice success-notice" role="status">
                <CheckCircle2 size={18} />
                <span>
                  Enviámos um e-mail com as instruções para redefinir a tua
                  senha.
                </span>
              </div>
            )}

            {resetError && (
              <div className="notice error" role="alert">
                <CircleAlert size={18} />
                <span>{resetError}</span>
              </div>
            )}

            <Button
              variant="secondary"
              onClick={handleRequestPasswordReset}
              disabled={sendingReset || resetSent}
            >
              {sendingReset
                ? "A enviar…"
                : "Enviar e-mail de redefinição de senha"}
            </Button>
          </div>

          <div className="settings-card">
            <h3>Terminar sessão</h3>
            <p className="card-desc">
              Encerra a sessão atual neste dispositivo.
            </p>
            <Button
              variant="ghost"
              onClick={async () => {
                await actions?.signOut();
              }}
              className="logout-btn"
            >
              <LogOut size={16} />
              <span>Terminar sessão</span>
            </Button>
          </div>
        </>
      ) : (
        <div className="settings-card">
          <h3>Sessão não iniciada</h3>
          <p className="card-desc">
            Inicia sessão para aceder às opções de segurança da tua conta.
          </p>
          <ActionLink to="/entrar?next=/definicoes/seguranca">
            Iniciar sessão
          </ActionLink>
        </div>
      )}
    </section>
  );
}

export function SettingsPrivacyPage() {
  return (
    <section className="settings-page">
      <div className="settings-header">
        <span className="eyebrow">DEFINIÇÕES</span>
        <h1>Privacidade da conta</h1>
        <p>
          Conhece as regras de visibilidade e privacidade dos teus dados no
          Arquivo Global.
        </p>
      </div>

      <div className="settings-card">
        <h3>Conteúdo público</h3>
        <p className="card-desc">
          O perfil pode ser consultado e guardado no Supabase quando o serviço
          está configurado. A aplicação só pode confirmar as políticas do
          servidor após verificação remota. O catálogo atual contém exemplos;
          marcar uma obra local como Publicada não a publica remotamente.
        </p>
      </div>

      <div className="settings-card">
        <h3>Conteúdo privado</h3>
        <p className="card-desc">
          Os rascunhos, a biblioteca, o histórico e as imagens ficam neste
          navegador, separados entre o espaço de visitante e cada conta. Não são
          sincronizados entre dispositivos. Esta separação na aplicação não é
          encriptação: quem tiver acesso ao perfil do navegador pode aceder ao
          armazenamento local. Limpar os dados do navegador pode apagar estas
          cópias; exporta uma cópia de segurança.
        </p>
      </div>
    </section>
  );
}

export function SettingsAccessibilityPage() {
  const preferences = usePreferences();
  const reducedMotion = preferences.accessibility.reducedMotion;
  const highContrast = preferences.accessibility.highContrast;
  const toggleReducedMotion = () =>
    updateAccessibility({ reducedMotion: !reducedMotion });
  const toggleHighContrast = () =>
    updateAccessibility({ highContrast: !highContrast });

  return (
    <section className="settings-page">
      <PreferenceRecovery />
      <Button
        variant="ghost"
        onClick={() =>
          updateAccessibility({ reducedMotion: null, highContrast: null })
        }
      >
        Seguir preferências do sistema
      </Button>
      <div className="settings-header">
        <span className="eyebrow">DEFINIÇÕES</span>
        <h1>Acessibilidade</h1>
        <p>Ajustes de navegação e conforto visual para todos os leitores.</p>
      </div>

      <div className="settings-card">
        <div className="toggle-row">
          <div>
            <h3>Reduzir animações</h3>
            <p className="card-desc">
              Minimiza transições visuais e efeitos de movimento.
            </p>
          </div>
          <Button
            variant={reducedMotion ? "primary" : "secondary"}
            onClick={toggleReducedMotion}
          >
            {reducedMotion === null
              ? "Automático (sistema)"
              : reducedMotion
                ? "Ativado"
                : "Desativado"}
          </Button>
        </div>
      </div>

      <div className="settings-card">
        <div className="toggle-row">
          <div>
            <h3>Contraste reforçado</h3>
            <p className="card-desc">
              Aumenta a nitidez das bordas e do texto para facilitar a leitura.
            </p>
          </div>
          <Button
            variant={highContrast ? "primary" : "secondary"}
            onClick={toggleHighContrast}
          >
            {highContrast === null
              ? "Automático (sistema)"
              : highContrast
                ? "Ativado"
                : "Desativado"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function PreferenceRecovery() {
  const { warning } = usePreferences();
  return (
    <div>
      {warning && <p role="alert">{warning}</p>}
      <details>
        <summary>Recuperação de preferências antigas</summary>
        <p>
          As escolhas globais aplicam-se a todos os leitores. Ajustes feitos num
          leitor têm prioridade nesse formato até voltares a alterar a mesma
          opção nas definições globais. Os originais antigos são preservados.
        </p>
        <Button
          variant="ghost"
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(preferenceOriginals(), null, 2)], {
                type: "application/json",
              }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = "arquivo-global-preferencias.json";
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Exportar preferências originais
        </Button>
      </details>
    </div>
  );
}
