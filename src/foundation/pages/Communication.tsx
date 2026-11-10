import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bell, CircleCheck, Flag } from "lucide-react";
import { Button, Field, Select } from "../components/ui";
import { useAuth } from "../features/auth/AuthProvider";
import { reportReasons, validateReport } from "../features/completion/data";
import {
  CompletionPage,
  DateLabel,
  ResourceState,
  useResource,
} from "../features/completion/ui";
export function NotificationsPage() {
  const { state } = useAuth();
  return <NotificationsContent key={state.user?.id ?? "guest"} />;
}
function NotificationsContent() {
  const demo = false;
  const [filter, setFilter] = useState("");
  const [type, setType] = useState("");
  const [read, setRead] = useState<Record<string, boolean>>({});
  const { result, retry } = useResource("notifications", demo);
  const items =
    result.status === "ready"
      ? result.data
          .map((n) => ({ ...n, read: read[n.id] ?? n.read }))
          .filter(
            (n) =>
              (!type || n.type === type) &&
              (!filter || (filter === "read" ? n.read : !n.read)),
          )
      : [];
  const dates = [...new Set(items.map((n) => n.date.slice(0, 10)))];
  return (
    <CompletionPage
      compact
      eyebrow="A TUA CONTA"
      title="Notificações"
      description="Novidades relevantes, organizadas para consultares ao teu ritmo."
    >
      <div className="completion-toolbar">
        <Select
          label="Estado da notificação"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todas</option>
          <option value="unread">Não lidas</option>
          <option value="read">Lidas</option>
        </Select>
        <Select
          label="Tipo de notificação"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="leitura">Leitura</option>
          <option value="colecao">Coleções</option>
          <option value="conta">Conta</option>
        </Select>
        <Button
          variant="secondary"
          disabled={
            result.status !== "ready" || true || !items.some((n) => !n.read)
          }
          onClick={() =>
            setRead((current) => ({
              ...current,
              ...Object.fromEntries(items.map((n) => [n.id, true])),
            }))
          }
        >
          Marcar visíveis como lidas
        </Button>
      </div>
      <ResourceState
        result={result}
        retry={retry}
        empty={!items.length}
        emptyTitle="Sem notificações neste filtro"
      >
        {dates.map((date) => (
          <section className="completion-group" key={date}>
            <h2>
              <DateLabel value={date + "T12:00:00Z"} />
            </h2>
            <ul className="completion-notifications">
              {items
                .filter((n) => n.date.startsWith(date))
                .map((n) => (
                  <li key={n.id} className={n.read ? "is-read" : "is-unread"}>
                    <Bell aria-hidden="true" />
                    <article>
                      <span className="badge">
                        {n.read ? "Lida" : "Não lida"}
                      </span>
                      <h3>{n.title}</h3>
                      <p>{n.description}</p>
                      <div className="actions">
                        <Link className="text-link" to={n.to}>
                          Abrir contexto →
                        </Link>
                        <Button
                          variant="ghost"
                          disabled={result.status !== "ready" || true}
                          onClick={() =>
                            setRead((current) => ({
                              ...current,
                              [n.id]: !n.read,
                            }))
                          }
                        >
                          {n.read
                            ? "Marcar como não lida"
                            : "Marcar como lida"}{" "}
                        </Button>
                      </div>
                    </article>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </ResourceState>
    </CompletionPage>
  );
}
export function ReportPage() {
  const [params] = useSearchParams();
  const initial = params.get("conteudo") ?? "";
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState(
    initial.length <= 240 ? initial : "",
  );
  const [errors, setErrors] = useState<ReturnType<typeof validateReport>>({});
  const [checked, setChecked] = useState(false);
  function changed() {
    setChecked(false);
  }
  return (
    <CompletionPage
      eyebrow="CUIDAR DA COMUNIDADE"
      title="Sinalizar um problema"
      description="Identifica o conteúdo e explica a situação com clareza, sem incluir dados pessoais sensíveis."
    >
      <div className="completion-two-columns">
        <form
          className="completion-card completion-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const next = validateReport(reason, description, reference);
            setErrors(next);
            setChecked(!Object.keys(next).length);
          }}
        >
          <div className="notice">
            <Flag size={20} aria-hidden="true" />
            <p>
              <strong>Envio indisponível.</strong> Não há serviço de denúncias
              integrado. Nenhum texto é guardado ou enviado; sair desta página
              descarta-o.
            </p>
          </div>
          <Select
            label="Motivo"
            required
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              changed();
            }}
            aria-invalid={!!errors.reason}
            aria-describedby={errors.reason ? "report-reason-error" : undefined}
          >
            <option value="">Selecionar motivo</option>
            {reportReasons.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
          {errors.reason && (
            <p
              className="completion-error"
              role="alert"
              id="report-reason-error"
            >
              {errors.reason}
            </p>
          )}
          <Field
            label="Referência ao conteúdo (opcional)"
            placeholder="/obras/atlas-das-mares"
            maxLength={240}
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              changed();
            }}
            aria-invalid={!!errors.reference}
            aria-describedby="report-reference-help report-reference-error"
          />
          <small id="report-reference-help">
            Usa o caminho de uma obra ou perfil deste site, sem domínio ou
            parâmetros.
          </small>
          <p
            className="completion-error"
            id="report-reference-error"
            role={errors.reference ? "alert" : undefined}
          >
            {errors.reference}
          </p>
          <label className="field" htmlFor="report-description">
            <span>Descrição</span>
            <textarea
              id="report-description"
              rows={7}
              required
              maxLength={2000}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                changed();
              }}
              aria-invalid={!!errors.description}
              aria-describedby="report-description-help report-description-error"
            />
          </label>
          <small id="report-description-help">
            20–2000 caracteres · {description.length}/2000
          </small>
          <p
            className="completion-error"
            id="report-description-error"
            role={errors.description ? "alert" : undefined}
          >
            {errors.description}
          </p>
          <div className="actions">
            <Button type="submit">Verificar formulário</Button>
            <Button type="button" disabled aria-describedby="report-disabled">
              Enviar denúncia
            </Button>
          </div>
          <p id="report-disabled">
            O envio só ficará disponível com persistência e confirmação do
            servidor.
          </p>
          {checked && (
            <div className="notice" role="status">
              <CircleCheck aria-hidden="true" />
              Campos válidos. A denúncia não foi enviada.
            </div>
          )}
        </form>
        <aside className="completion-card">
          <span className="eyebrow">ANTES DE CONTINUAR</span>
          <h2>Contexto ajuda a analisar</h2>
          <ul className="completion-bullets">
            <li>Indica a obra ou o perfil a que te referes.</li>
            <li>
              Descreve factos observáveis, sem divulgar informação privada.
            </li>
            <li>
              Não incluas senhas, códigos de acesso ou documentos pessoais.
            </li>
            <li>
              Este formulário não é um canal de atendimento ou de emergência.
            </li>
          </ul>
          <Link className="text-link" to="/regras">
            Consultar rascunho das regras →
          </Link>
          <Link className="text-link" to="/ajuda">
            Abrir centro de ajuda →
          </Link>
        </aside>
      </div>
    </CompletionPage>
  );
}
