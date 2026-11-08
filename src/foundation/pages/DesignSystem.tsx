import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Confirmation,
  Dropdown,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Modal,
  Pagination,
  Select,
} from "../components/ui";
import { useTheme, useToast } from "../app/providers";
export default function DesignSystem() {
  const [modal, setModal] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [page, setPage] = useState(1);
  const { theme, toggle } = useTheme();
  const toast = useToast();
  return (
    <section className="container design-page">
      <div className="page-intro">
        <span className="eyebrow">LABORATÓRIO / FUNDAÇÃO 2.0</span>
        <h1>Uma linguagem em comum.</h1>
        <p>Componentes acessíveis, tokens semânticos e dois temas completos.</p>
        <Button variant="secondary" onClick={toggle}>
          Alternar tema · {theme === "dark" ? "escuro" : "claro"}
        </Button>
      </div>
      <div className="design-grid">
        <Card>
          <h2>Cores & tipografia</h2>
          <div className="swatches">
            {["bg", "surface", "elevated", "accent", "text", "muted"].map(
              (token) => (
                <div key={token}>
                  <span style={{ background: `var(--${token})` }} />
                  <code>{token}</code>
                </div>
              ),
            )}
          </div>
          <h3>Uma voz para cada história.</h3>
          <p className="literary">
            A literatura começa onde a imaginação encontra espaço.
          </p>
          <code>Arquivo Global / v2.0</code>
        </Card>
        <Card>
          <h2>Botões & estados</h2>
          <div className="actions">
            <Button
              onClick={() =>
                toast("Notificação de demonstração. Nenhum dado enviado.")
              }
            >
              Mostrar notificação
            </Button>
            <Button variant="secondary" onClick={() => setModal(true)}>
              Abrir modal
            </Button>
            <Button variant="ghost" onClick={() => setConfirmation(true)}>
              Confirmar ação
            </Button>
            <Button disabled>Indisponível</Button>
          </div>
          <p>
            <Badge>Demonstração</Badge> <Badge>Em desenvolvimento</Badge>
          </p>
          <LoadingState />
        </Card>
        <Card>
          <h2>Campos & seleção</h2>
          <Field label="Título da obra" placeholder="Uma história por contar" />
          <Select label="Formato">
            <option>Romance</option>
            <option>Poesia</option>
          </Select>
          <label className="check">
            <input type="checkbox" /> Exemplo de preferência
          </label>
          <Dropdown label="Abrir opções">
            <Link to="/catalogo">Explorar catálogo</Link>
            <Link to="/definicoes/aparencia">Aparência</Link>
          </Dropdown>
        </Card>
        <Card>
          <h2>Feedback & navegação</h2>
          <ErrorState>Exemplo: não foi possível carregar os dados.</ErrorState>
          <div className="notice">Mensagem informativa de demonstração.</div>
          <Pagination page={page} pages={3} onChange={setPage} />
        </Card>
      </div>
      <Card>
        <EmptyState title="A próxima história pode ser tua">
          Exemplo de um estado vazio, com uma mensagem clara.
        </EmptyState>
      </Card>
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Uma janela para novas ideias"
      >
        <p>
          Usa Tab para navegar, Escape para fechar e voltar ao botão que abriu
          esta janela.
        </p>
        <Button onClick={() => setModal(false)}>Entendido</Button>
      </Modal>
      <Confirmation
        open={confirmation}
        onClose={() => setConfirmation(false)}
        onConfirm={() => toast("Ação demonstrativa confirmada.")}
      />
    </section>
  );
}
