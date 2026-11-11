import { slugify } from "../lib/discovery";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { inauguralWorks } from "../data/inaugural";
import type { Work } from "../data/works";
export function Cover({
  work,
  large = false,
}: {
  work: Work;
  large?: boolean;
}) {
  const editorial = inauguralWorks.find((item) => item.id === work.id);
  if (editorial)
    return (
      <div
        aria-hidden="true"
        className={`cover cover-${work.cover} ${large ? "cover-large" : ""}`}
      >
        <img
          className="editorial-cover-asset"
          src={editorial.coverAsset}
          alt=""
          width={600}
          height={800}
        />
      </div>
    );
  return (
    <div
      aria-hidden="true"
      className={`cover cover-${work.cover} ${large ? "cover-large" : ""}`}
    >
      <span className="cover-edition">
        {work.origin === "user-publication"
          ? "ARQUIVO GLOBAL / OBRA PUBLICADA"
          : "ARQUIVO GLOBAL / COMPOSIÇÃO LOCAL"}
      </span>
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
        <p>{work.author}</p>
        <div className="work-tags">
          <span>{work.genre}</span>
          <span>
            {work.origin === "user-publication"
              ? "Publicada pelo autor"
              : "Edição inaugural · local"}
          </span>
        </div>
      </Link>
      <div className="work-tags" aria-label="Tags da obra">
        {work.tags.map((tag) => (
          <Link key={tag} to={`/tags/${encodeURIComponent(slugify(tag))}`}>
            {tag}
          </Link>
        ))}
      </div>
    </article>
  );
}
