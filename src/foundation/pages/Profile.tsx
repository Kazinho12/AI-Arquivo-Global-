import { editorialIdentity } from "../data/inaugural";
import { useEffect, useState, useId, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Calendar,
  PenLine,
  UserCheck,
  UserRound,
  UserX,
  BookOpen,
  ArrowLeft,
  CircleAlert,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";
import {
  fetchUserProfile,
  fetchProfileById,
  findAuthorWorks,
  resolveDemoProfile,
  saveUserProfile,
} from "../features/profile/service";
import {
  validateBio,
  validateDisplayName,
  validateUsername,
  type UserProfile,
} from "../features/profile/types";
import { WorkCard } from "../components/WorkCard";
import { ActionLink, Button, LoadingState, EmptyState } from "../components/ui";
import type { Work } from "../data/works";

function formatJoinDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "Membro recente";
    const month = date.toLocaleDateString("pt-PT", { month: "long" });
    const year = date.getFullYear();
    return `Membro desde ${month} de ${year}`;
  } catch {
    return "Membro recente";
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AG";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { state: authState } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    return username ? resolveDemoProfile(username.toLowerCase()) : null;
  });
  const [works, setWorks] = useState<Work[]>(() => {
    if (!username) return [];
    const initial = resolveDemoProfile(username.toLowerCase());
    return initial ? findAuthorWorks(initial.id) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableMissing, setTableMissing] = useState(false);

  useEffect(() => {
    if (!username) return;
    let active = true;
    setLoading(true);
    setError(null);
    setTableMissing(false);

    fetchUserProfile(username)
      .then((res) => {
        if (!active) return;
        setProfile(res.profile);
        setTableMissing(Boolean(res.tableMissing));
        if (res.error && !res.profile) {
          setError(res.error);
        }
        if (res.profile) {
          const authorWorks = findAuthorWorks(res.profile.id);
          setWorks(authorWorks);
        } else {
          setWorks([]);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Falha na comunicação com o serviço.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="container profile-page loading-page">
        <LoadingState />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="container profile-page">
        <div className="profile-error notice error" role="alert">
          <CircleAlert size={22} />
          <div>
            <strong>Erro ao aceder ao perfil</strong>
            <p>{error}</p>
          </div>
        </div>
        <div className="profile-actions-bar">
          <ActionLink to="/catalogo">Voltar ao catálogo</ActionLink>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container profile-page profile-not-found">
        <span className="eyebrow">PERFIL DE AUTOR</span>
        <div className="profile-not-found-icon">
          <UserX size={44} />
        </div>
        <h1>Autor não encontrado</h1>
        <p>
          Não encontrámos nenhum perfil registado ou obra associada ao
          identificador <strong>@{username}</strong>.
        </p>
        <div className="profile-actions-bar">
          <ActionLink to="/catalogo">Explorar o catálogo</ActionLink>
          <Link to="/" className="text-link">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const isOwner =
    authState.status === "authenticated" &&
    authState.user &&
    authState.user.id === profile.id;

  return (
    <div className="container profile-page">
      {tableMissing && (
        <div className="notice" role="status">
          <Info size={18} />
          <div>
            <strong>Base de dados em preparação:</strong> A tabela{" "}
            <code>profiles</code> ainda não foi criada no Supabase. Os dados
            apresentados provêm do catálogo editorial preparado localmente.
          </div>
        </div>
      )}

      <header className="profile-header">
        <div className="profile-avatar-area">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="profile-avatar-img"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="profile-avatar-monogram"
              aria-label={`Avatar de ${profile.displayName}`}
            >
              <span>{getInitials(profile.displayName)}</span>
            </div>
          )}
        </div>

        <div className="profile-details">
          <div className="profile-title-row">
            <h1>{profile.displayName}</h1>
            {isOwner && (
              <Link to="/perfil/editar" className="button secondary edit-btn">
                <PenLine size={15} />
                <span>Editar perfil</span>
              </Link>
            )}
          </div>

          <div className="profile-meta-row">
            <span className="profile-handle">{`@${profile.username}`}</span>
            <span className="meta-separator" aria-hidden="true">
              ·
            </span>
            <span className="profile-joined">
              <Calendar size={13} aria-hidden="true" />
              <span>
                {profile.id === editorialIdentity.id
                  ? "Identidade editorial local · sem conta administrativa"
                  : formatJoinDate(profile.createdAt)}
              </span>
            </span>
            <span className="meta-separator" aria-hidden="true">
              ·
            </span>
            <Link
              to={`/utilizadores/${profile.username}/seguidores`}
              className="profile-followers-link"
            >
              <UserCheck size={13} aria-hidden="true" />
              <span>Seguidores</span>
            </Link>
          </div>

          <div className="profile-bio-box">
            {profile.bio ? (
              <p className="profile-bio-text">{profile.bio}</p>
            ) : (
              <p className="profile-bio-empty">
                Este autor ainda não adicionou uma biografia.
              </p>
            )}
          </div>
        </div>
      </header>

      <section
        className="profile-works-section"
        aria-labelledby="obras-heading"
      >
        <div className="profile-works-header">
          <h2 id="obras-heading">
            Obras no catálogo local{" "}
            <span className="profile-works-count">({works.length})</span>
          </h2>
          <span className="eyebrow">CATÁLOGO DO AUTOR</span>
        </div>

        {works.length > 0 ? (
          <div className="work-grid">
            {works.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        ) : (
          <EmptyState title="Nenhuma obra publicada">
            <p>
              Este autor ainda não publicou nenhuma história no catálogo aberto
              do Arquivo Global.
            </p>
            <ActionLink to="/catalogo">Explorar outras histórias</ActionLink>
          </EmptyState>
        )}
      </section>
    </div>
  );
}

export function EditProfilePage() {
  const { state: authState } = useAuth();
  const [loading, setLoading] = useState(
    () => authState.status === "authenticated",
  );
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savedHandle, setSavedHandle] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const nameId = useId();
  const usernameId = useId();
  const bioId = useId();

  useEffect(() => {
    if (authState.status === "initializing") return;
    if (authState.status !== "authenticated" || !authState.user) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetchProfileById(authState.user.id)
      .then((res) => {
        if (!active) return;
        if (res.profile) {
          setDisplayName(res.profile.displayName);
          setUsername(res.profile.username);
          setBio(res.profile.bio);
          setSavedHandle(res.profile.username);
        } else {
          // Defaults from metadata or email
          const initialName =
            authState.user?.user_metadata?.display_name ||
            authState.user?.user_metadata?.name ||
            "";
          const initialUser =
            authState.user?.user_metadata?.username ||
            authState.user?.email?.split("@")[0] ||
            "";
          setDisplayName(initialName);
          setUsername(initialUser);
        }
        if (res.tableMissing) {
          setNotice(
            "A tabela 'profiles' ainda não foi criada no Supabase. Para guardar alterações permanentes, aplica a migração SQL no teu projeto.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authState.status, authState.user]);

  if (authState.status === "initializing" || loading) {
    return (
      <div className="container loading-page">
        <LoadingState />
      </div>
    );
  }

  if (authState.status !== "authenticated" || !authState.user) {
    return (
      <section className="profile-edit-shell">
        <h1>Editar perfil</h1>
        <div className="notice" role="alert">
          <UserRound size={20} />
          <div>
            <strong>Autenticação necessária</strong>
            <p>Precisas de ter sessão iniciada para gerir o teu perfil.</p>
          </div>
        </div>
        <div className="profile-actions-bar">
          <ActionLink to="/entrar?next=/perfil/editar">
            Iniciar sessão
          </ActionLink>
          <Link to="/" className="text-link">
            Voltar ao início
          </Link>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const nameErr = validateDisplayName(displayName);
    if (nameErr) {
      setError(nameErr);
      return;
    }

    const userErr = validateUsername(username);
    if (userErr) {
      setError(userErr);
      return;
    }

    const bioErr = validateBio(bio);
    if (bioErr) {
      setError(bioErr);
      return;
    }

    if (!authState.user) {
      setError("Sessão não disponível. Inicia sessão novamente.");
      return;
    }

    setSaving(true);
    const result = await saveUserProfile(authState.user.id, {
      displayName,
      username,
      bio,
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.message || "Erro ao gravar perfil.");
    } else {
      setSuccess("Perfil atualizado com sucesso.");
      setSavedHandle(username.trim().toLowerCase());
    }
  };

  return (
    <section className="profile-edit-shell">
      <div className="profile-edit-header">
        <Link to="/definicoes" className="back-link">
          <ArrowLeft size={16} /> Voltar às definições
        </Link>
        <span className="eyebrow">A TUA CONTA</span>
        <h1>Editar perfil</h1>
        <p>Gere as informações públicas apresentadas na tua página de autor.</p>
      </div>

      {notice && (
        <div className="notice" role="status">
          <Info size={18} />
          <div>{notice}</div>
        </div>
      )}

      {error && (
        <div className="notice error" role="alert">
          <CircleAlert size={18} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="notice success-notice" role="status">
          <CheckCircle2 size={18} />
          <div>
            <span>{success}</span>
            {savedHandle && (
              <Link
                to={`/utilizadores/${savedHandle}`}
                className="view-public-link"
              >
                Ver perfil público →
              </Link>
            )}
          </div>
        </div>
      )}

      <form className="profile-edit-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor={nameId}>Nome de apresentação</label>
          <input
            id={nameId}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ex.: Lia Mavume"
            required
            maxLength={60}
            disabled={saving}
          />
          <small className="field-hint">
            Visível como o teu nome autoral em todas as obras e comentários.
          </small>
        </div>

        <div className="field">
          <label htmlFor={usernameId}>Username único</label>
          <div className="username-input-wrap">
            <span className="username-prefix">@</span>
            <input
              id={usernameId}
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ""),
                )
              }
              placeholder="exemplo_autor"
              required
              minLength={3}
              maxLength={30}
              disabled={saving}
            />
          </div>
          <small className="field-hint">
            Utilizado no URL público do teu perfil:{" "}
            <code>/utilizadores/{username || "..."}</code>. Apenas letras,
            números e sublinhados.
          </small>
        </div>

        <div className="field">
          <label htmlFor={bioId}>
            Biografia <span className="char-count">({bio.length}/500)</span>
          </label>
          <textarea
            id={bioId}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conta um pouco sobre ti, os teus géneros de escrita favoritos ou as tuas criações..."
            maxLength={500}
            rows={4}
            disabled={saving}
          />
        </div>

        <div className="avatar-info-panel">
          <div className="avatar-preview">
            <div className="profile-avatar-monogram small">
              <span>{getInitials(displayName || username || "AG")}</span>
            </div>
            <div>
              <strong>Avatar de autor</strong>
              <p>
                O teu avatar é gerado a partir do teu monograma autoral. O
                carregamento direto de imagens para armazenamento R2 estará
                disponível quando a API segura de ficheiros for concluída.
              </p>
            </div>
          </div>
        </div>

        <div className="profile-edit-actions">
          <Button type="submit" disabled={saving}>
            {saving ? "A guardar…" : "Guardar alterações"}
          </Button>
          {savedHandle && (
            <Link
              to={`/utilizadores/${savedHandle}`}
              className="button secondary"
            >
              Ver perfil
            </Link>
          )}
        </div>
      </form>
    </section>
  );
}

// Compatibility export: the followers interface is isolated from profile editing.
export { FollowersPage } from "./Community";
