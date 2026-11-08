import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { Work } from "../data/works";
export function Cover({
  work,
  large = false,
}: {
  work: Work;
  large?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`cover cover-${work.cover} ${large ? "cover-large" : ""}`}
    >
      <span className="cover-edition">ARQUIVO GLOBAL / EDIÇÃO DEMO</span>
      <div className="cover-art">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="cover-lettering">
        <span>{work.author}</span>
        <strong>{work.title}</strong>
        <small>UMA HISTÓRIA PARA ATRAVESSAR</small>
      </div>
      <span className="cover-number">AG — 00{work.cover}</span>
    </div>
  );
}
export function WorkCard({ work }: { work: Work }) {
  return (
    <article className="work-card">
      <Link to={`/obras/${work.id}`} className="work-link">
        <Cover work={work} />
        <div className="work-meta">
          <span>{work.format}</span>
          <ArrowUpRight size={17} />
        </div>
        <h3>{work.title}</h3>
        <p>
          {work.author} <span aria-hidden="true">·</span> Autor fictício
        </p>
        <div className="work-tags">
          <span>{work.genre}</span>
          <span>Demonstração</span>
        </div>
      </Link>
    </article>
  );
}
