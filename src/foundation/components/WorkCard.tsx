import { readCoverStyle } from "../data/covers";
import { slugify } from "../lib/discovery";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { Work } from "../data/works";
import { WorkCover } from "./WorkCover";

export function Cover({
  work,
  large = false,
}: {
  work: Work;
  large?: boolean;
}) {
  const accentColor =
    work.coverAccentColor || (work as any).cover_accent_color || "#14243B";

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
        style={readCoverStyle(work.coverStyle)}
        seed={work.coverSeed}
        format={work.format}
        editionLabel={"ARQUIVO GLOBAL / OBRA PUBLICADA"}
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
          <span>{"Publicada pelo autor"}</span>
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
