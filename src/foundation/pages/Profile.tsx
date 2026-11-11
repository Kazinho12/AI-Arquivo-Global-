import { AvatarEditor, ProfileAvatar } from "../features/profile/AvatarEditor";
import {
  FollowerCount,
  ProfilePublications,
} from "../features/profile/PublicProfileData";
import { editorialIdentity } from "../data/inaugural";
import { useEffect, useState, useId, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Calendar,
  PenLine,
  UserRound,
  UserX,
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
import { ActionLink, Button, LoadingState } from "../components/ui";

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

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { state: authState } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    return username ? resolveDemoProfile(username.toLowerCase()) : null;
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
          <ProfileAvatar
            name={profile.displayName}
            url={profile.avatarUrl}
            publicProfile
          />
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
            <FollowerCount
              key={profile.id}
              id={profile.id}
              editorial={profile.id === editorialIdentity.id}
            />
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

      <ProfilePublications
        key={profile.id}
        id={profile.id}
        editorialWorks={
          profile.id === editorialIdentity.id
            ? findAuthorWorks(profile.id)
            : undefined
        }
      />
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
  const [avatarProfile, setAvatarProfile] = useState<UserProfile | null>(null);
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
          setAvatarProfile(res.profile);
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
      if (result.profile) setAvatarProfile(result.profile);
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

        {avatarProfile && avatarProfile.id === authState.user.id ? (
          <AvatarEditor
            key={avatarProfile.id}
            profile={avatarProfile}
            onChange={setAvatarProfile}
          />
        ) : (
          <p role="status">
            A fotografia só pode ser gerida depois de carregar o perfil
            persistido.
          </p>
        )}

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
