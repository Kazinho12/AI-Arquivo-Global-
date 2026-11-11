import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Cover } from "../../components/WorkCard";
import type { Work } from "../../data/works";

export function HeroCovers({ works }: { works: Work[] }) {
  const positions = ["front", "back", "depth-one", "depth-two", "depth-three"];
  return (
    <div
      className="hero-visual home-cover-stack"
      aria-label="Capas de publicações recentes"
    >
      <div className="orbital orbital-one" aria-hidden="true" />
      <div className="orbital orbital-two" aria-hidden="true" />
      <span className="star star-one" aria-hidden="true">
        ✧
      </span>
      <span className="star star-two" aria-hidden="true">
        +
      </span>
      {positions.map((position, i) =>
        works[i] ? (
          <Link
            key={position}
            className={`hero-book hero-book-${position}`}
            to={`/obras/${works[i].id}`}
            aria-label={`Conhecer ${works[i].title}, de ${works[i].author}`}
          >
            <Cover work={works[i]} />
          </Link>
        ) : (
          <div
            key={position}
            className={`hero-book hero-book-${position} hero-book-neutral`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 150 210" fill="none">
              <rect
                x="8"
                y="8"
                width="134"
                height="194"
                rx="2"
                stroke="currentColor"
              />
              <circle cx="75" cy="85" r={25 + i * 4} stroke="currentColor" />
              <path
                d="M30 155H120M50 165H100M75 45V125"
                stroke="currentColor"
              />
            </svg>
          </div>
        ),
      )}
      <div className="floating-note" aria-hidden="true">
        <Sparkles size={16} />
        <span>
          A próxima descoberta
          <br />
          <strong>começa numa página.</strong>
        </span>
      </div>
      <span className="visual-caption">HISTÓRIAS REAIS · NOVAS VOZES</span>
    </div>
  );
}
