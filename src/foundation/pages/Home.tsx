import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Feather,
  Frame,
  Globe2,
  Layers3,
  Orbit,
  PenLine,
  Sparkles,
} from "lucide-react";
import { Cover, WorkCard } from "../components/WorkCard";
import { ActionLink, SearchField } from "../components/ui";
import { demoWorks } from "../data/works";
const formatCards = [
  {
    name: "Romances & contos",
    text: "Mundos inteiros em palavras.",
    format: "Romance",
    icon: BookOpen,
  },
  {
    name: "Poesia",
    text: "O infinito entre duas linhas.",
    format: "Poesia",
    icon: Feather,
  },
  {
    name: "HQs & comics",
    text: "Histórias que ganham traço.",
    format: "HQ / Comic",
    icon: Frame,
  },
  {
    name: "Mangás",
    text: "Outras formas de imaginar.",
    format: "Mangá",
    icon: Layers3,
  },
];
export default function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow hero-label">
            <span className="tiny-line" /> UM UNIVERSO DE HISTÓRIAS
          </div>
          <h1>
            Onde as histórias
            <br />
            encontram o <em>mundo.</em>
          </h1>
          <p>
            Palavras, traços e universos por descobrir.
            <br className="wide-only" /> Um espaço aberto para ler, criar e ir
            mais longe.
          </p>
          <form
            className="hero-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/pesquisa?q=${encodeURIComponent(query)}`);
            }}
          >
            <SearchField value={query} onChange={setQuery} />
            <button className="search-submit" aria-label="Pesquisar">
              <ArrowRight size={21} />
            </button>
          </form>
          <div className="hero-footnote">
            <span className="status-dot" /> Gratuito para ler. Livre para criar.
          </div>
        </div>
        <div className="hero-visual">
          <div className="orbital orbital-one" />
          <div className="orbital orbital-two" />
          <span className="star star-one">✧</span>
          <span className="star star-two">+</span>
          <div className="hero-book hero-book-back">
            <Cover work={demoWorks[2]} />
          </div>
          <div className="hero-book hero-book-front">
            <Cover work={demoWorks[0]} />
          </div>
          <div className="floating-note">
            <Sparkles size={16} />
            <span>
              A próxima descoberta
              <br />
              <strong>começa numa página.</strong>
            </span>
          </div>
          <span className="visual-caption">CAPAS E OBRAS DE DEMONSTRAÇÃO</span>
        </div>
      </section>
      <div className="manifesto-strip">
        <div className="container">
          <span>
            <Globe2 size={17} /> Histórias sem fronteiras
          </span>
          <span>
            <PenLine size={17} /> Publicação aberta
          </span>
          <span>
            <BookOpen size={17} /> Leitura gratuita
          </span>
          <a href="#formatos">
            Encontra o teu próximo universo <ArrowDown size={16} />
          </a>
        </div>
      </div>
      <section id="formatos" className="container section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CADA HISTÓRIA, UMA FORMA</span>
            <h2>Como gostas de explorar?</h2>
          </div>
          <Link className="text-link" to="/catalogo">
            Todos os formatos <ArrowRight size={16} />
          </Link>
        </div>
        <div className="format-grid">
          {formatCards.map(({ name, text, format, icon: Icon }) => (
            <Link
              className="format-card"
              key={name}
              to={`/catalogo?formato=${encodeURIComponent(format)}`}
            >
              <Icon size={25} strokeWidth={1.5} />
              <h3>{name}</h3>
              <p>{text}</p>
              <ArrowUp />
            </Link>
          ))}
        </div>
        <div className="format-extra">
          Também há espaço para{" "}
          <Link to="/catalogo?formato=Fanfiction">fanfictions</Link>,{" "}
          <Link to="/catalogo?formato=S%C3%A9rie+liter%C3%A1ria">
            séries literárias
          </Link>{" "}
          e <Link to="/catalogo?formato=Obra+ilustrada">obras ilustradas</Link>.
        </div>
      </section>
      <section className="container section showcase">
        <div className="section-heading">
          <div>
            <span className="eyebrow">UM PRIMEIRO OLHAR</span>
            <h2>Abre uma nova possibilidade.</h2>
          </div>
          <Link className="text-link" to="/catalogo">
            Explorar catálogo <ArrowRight size={16} />
          </Link>
        </div>
        <p className="demo-notice">
          Seleção demonstrativa · Todas as obras e autores abaixo são fictícios.
        </p>
        <div className="work-grid">
          {demoWorks.slice(0, 4).map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      </section>
      <section className="container">
        <div className="invitation">
          <div className="invitation-symbol">
            <Orbit size={98} strokeWidth={0.7} />
          </div>
          <div>
            <span className="eyebrow">A IMAGINAÇÃO NÃO PEDE LICENÇA</span>
            <h2>
              A tua história também
              <br />
              tem lugar aqui.
            </h2>
            <p>
              Um arquivo aberto, feito de vozes diferentes. Publica sem
              aprovação editorial prévia, respeitando as regras da comunidade.
            </p>
            <div className="actions">
              <ActionLink to="/estudio">Conhecer o Estúdio</ActionLink>
              <Link className="text-link" to="/regras">
                Conhecer as regras <ArrowRight size={16} />
              </Link>
            </div>
            <small>
              Publicação e criação de conta disponíveis numa próxima etapa.
            </small>
          </div>
        </div>
      </section>
    </>
  );
}
function ArrowUp() {
  return <ArrowRight className="format-arrow" size={16} />;
}
