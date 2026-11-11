import { slugify } from "../lib/discovery";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { inauguralWorks } from "../data/inaugural";
import type { Work } from "../data/works";
import { WorkCover } from "./WorkCover";

export function Cover({
  work,
  large = false,
}: {
  work: Work;
  large?: boolean;
}) {
  const editorial = inauguralWorks.find((item) => item.id === work.id);
  if (editorial && editorial.coverAsset) {
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
  }

  const accentColor =
    work.coverAccentColor ||
    (work as any).cover_accent_color ||
    "#14243B";

  return (
    <div
      aria-hidden="true"
      className={`cover-container overflow-hidden rounded ${large ? "cover-large" : ""}`}
    >
      <WorkCover
        title={work.title}
        author={work.author}
        subtitle={work.subtitle}
        color={accentColor}
        style="legacy"
        format={work.format}
        editionLabel={
          work.origin === "user-publication"
            ? "ARQUIVO GLOBAL / OBRA PUBLICADA"
            : "ARQUIVO GLOBAL / COMPOSIÇÃO LOCAL"
        }
        size={large ? "lg" : "responsive"}
      />
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
