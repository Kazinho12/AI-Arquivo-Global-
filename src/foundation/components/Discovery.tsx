import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { WorkCard } from "./WorkCard";
import { EmptyState } from "./ui";
import type { Work } from "../data/works";
import { getTags, slugify } from "../lib/discovery";
export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function DemoNotice() {
  return (
    <p className="discovery-demo">
      <span className="status-dot" />
      Obras publicadas pelos autores do Arquivo Global.
    </p>
  );
}
export function WorkGrid({ works }: { works: readonly Work[] }) {
  return works.length ? (
    <div className="work-grid">
      {works.map((work) => (
        <WorkCard key={work.id} work={work} />
      ))}
    </div>
  ) : (
    <EmptyState title="Ainda não há obras nesta seleção">
      Experimenta outra combinação ou explora o catálogo completo.
    </EmptyState>
  );
}
export function WorkSection({
  title,
  eyebrow,
  description,
  works,
  to = "/catalogo",
  linkLabel = "Ver catálogo",
}: {
  title: string;
  eyebrow: string;
  description: string;
  works: readonly Work[];
  to?: string;
  linkLabel?: string;
}) {
  return (
    <section className="section discovery-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <Link className="text-link" to={to}>
          {linkLabel}
          <ArrowRight size={16} />
        </Link>
      </div>
      <p className="section-description">{description}</p>
      <WorkGrid works={works} />
    </section>
  );
}
export function TagLinks({
  names,
  works,
}: {
  names?: readonly string[];
  works: readonly Work[];
}) {
  const tags = names
    ? names.map((name) => ({ name, slug: slugify(name), count: 0 }))
    : getTags(works);
  return (
    <div className="tag-cloud">
      {tags.map((tag) => (
        <Link key={tag.slug} to={`/tags/${tag.slug}`}>
          <span aria-hidden="true">#</span>
          {tag.name}
          {!names && (
            <span className="tag-count">
              {tag.count}
              <span className="sr-only"> obras no catálogo</span>
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { label: string; to?: string }[];
}) {
  return (
    <nav className="breadcrumbs" aria-label="Caminho de navegação">
      <ol>
        {items.map((item, i) => (
          <li key={i}>
            {item.to ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
