import React from 'react';
import { Work } from '../../types';
import { FormatBadge } from '../ui/Badge';
import { AgeRating } from '../ui/AgeRating';
import { ContentWarning } from '../ui/ContentWarning';
import { GenreLabel } from '../ui/GenreLabel';
import { BookOpen, Bookmark, Star } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface WorkCardProps {
  work: Work;
  onSelect: (work: Work) => void;
  layout?: 'grid' | 'list';
}

export const WorkCard: React.FC<WorkCardProps> = ({
  work,
  onSelect,
  layout = 'grid',
}) => {
  const { showToast } = useToast();
  const [isSaved, setIsSaved] = React.useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    showToast(
      isSaved ? 'Obra removida' : 'Obra guardada',
      isSaved ? `"${work.title}" removida da sua biblioteca.` : `"${work.title}" adicionada à sua estante pessoal.`,
      'success'
    );
  };

  if (layout === 'list') {
    return (
      <article
        onClick={() => onSelect(work)}
        className="group relative flex flex-col sm:flex-row items-stretch gap-5 p-4 bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] rounded-xl hover:border-[#203B5C] dark:hover:border-[#BFC9D6]/60 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
      >
        {/* Thumbnail Cover */}
        <div className="relative w-full sm:w-36 aspect-[3/4] rounded-lg overflow-hidden shrink-0 bg-[#E7EDF5] dark:bg-[#0B1220] border border-[#D8E2ED] dark:border-[#203B5C]">
          {work.coverUrl ? (
            <img
              src={work.coverUrl}
              alt={`Capa da obra ${work.title}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full p-3 flex flex-col justify-between bg-gradient-to-br from-[#14243B] to-[#0B1220] text-[#F8FAFC]">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#BFC9D6]">
                {work.format}
              </span>
              <p className="font-title text-sm font-semibold line-clamp-3">
                {work.title}
              </p>
              <div className="h-0.5 w-6 bg-[#BFC9D6]/40" />
            </div>
          )}

          {work.isDemoCover && (
            <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[8px] font-mono tracking-tighter text-center py-0.5 px-1 bg-[#0B1220]/80 backdrop-blur-xs text-[#BFC9D6] rounded">
              Demonstração
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <FormatBadge format={work.format} />
              <AgeRating rating={work.ageRating} />
              <span className="text-xs text-[#5A6D82] dark:text-[#BFC9D6]">·</span>
              <span className="text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
                {work.status === 'completed' ? 'Concluído' : 'Em andamento'}
              </span>

              {work.contentWarnings && work.contentWarnings.length > 0 && (
                <ContentWarning warnings={work.contentWarnings} size="sm" />
              )}
            </div>

            <h3 className="font-title text-xl sm:text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC] group-hover:text-[#203B5C] dark:group-hover:text-[#BFC9D6] transition-colors">
              {work.title}
            </h3>

            <p className="text-xs font-medium text-[#5A6D82] dark:text-[#BFC9D6] mt-0.5">
              Por <span className="text-[#0B1220] dark:text-[#E7EDF5]">{work.author}</span>
            </p>

            <p className="mt-2.5 text-xs sm:text-sm text-[#5A6D82] dark:text-[#BFC9D6] line-clamp-2 leading-relaxed">
              {work.synopsis}
            </p>

            {/* Genre labels */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {work.genres.map((g) => (
                <GenreLabel key={g} genre={g} size="sm" />
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D8E2ED] dark:border-[#203B5C]/60 flex items-center justify-between text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
            <div className="flex items-center gap-2">
              <span>{work.chaptersCount} cap.</span>
              <span aria-hidden="true">·</span>
              <span>{work.readTime}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 font-mono text-[#0B1220] dark:text-[#F8FAFC]">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {work.rating.toFixed(1)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-[#14243B] text-[#F8FAFC] border-[#203B5C] dark:bg-[#BFC9D6] dark:text-[#0B1220]'
                  : 'border-[#D8E2ED] dark:border-[#203B5C] hover:bg-[#E7EDF5] dark:hover:bg-[#203B5C]'
              }`}
              title={isSaved ? 'Guardado' : 'Guardar na biblioteca'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Grid layout (Standard 3:4 Card)
  return (
    <article
      onClick={() => onSelect(work)}
      className="group relative flex flex-col bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] rounded-xl overflow-hidden hover:border-[#203B5C] dark:hover:border-[#BFC9D6]/60 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-lg"
    >
      {/* 3:4 Aspect ratio book / comic cover */}
      <div className="relative aspect-[3/4] w-full bg-[#E7EDF5] dark:bg-[#0B1220] overflow-hidden">
        {work.coverUrl ? (
          <img
            src={work.coverUrl}
            alt={`Capa da obra ${work.title}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full p-5 flex flex-col justify-between bg-gradient-to-br from-[#14243B] via-[#0B1220] to-[#203B5C] text-[#F8FAFC]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#BFC9D6]">
                {work.format}
              </span>
              <AgeRating rating={work.ageRating} />
            </div>

            <div className="my-auto text-center px-2">
              <p className="font-title text-xl font-bold leading-tight text-[#F8FAFC]">
                {work.title}
              </p>
              <div className="h-0.5 w-10 bg-[#BFC9D6]/50 mx-auto mt-3" />
            </div>

            <div className="text-right">
              <p className="text-xs text-[#BFC9D6]">{work.author}</p>
            </div>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <FormatBadge format={work.format} variant="filled" />
          <AgeRating rating={work.ageRating} />
        </div>

        {/* Bookmark quick action */}
        <button
          type="button"
          onClick={handleSave}
          className={`absolute top-2.5 right-2.5 p-2 rounded-lg backdrop-blur-md transition-all z-10 cursor-pointer ${
            isSaved
              ? 'bg-[#F8FAFC] text-[#0B1220] shadow-md'
              : 'bg-[#0B1220]/60 text-[#F8FAFC] hover:bg-[#0B1220]/90 border border-white/10'
          }`}
          title={isSaved ? 'Guardado' : 'Guardar na biblioteca'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Demo Indicator Notice */}
        {work.isDemoCover && (
          <div className="absolute bottom-0 inset-x-0 bg-[#0B1220]/85 backdrop-blur-xs py-1 px-2 text-center border-t border-white/5">
            <p className="text-[9px] font-mono tracking-wider text-[#BFC9D6] uppercase">
              Demonstração de Capa Editorial
            </p>
          </div>
        )}
      </div>

      {/* Details Box */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-title text-lg font-bold text-[#0B1220] dark:text-[#F8FAFC] group-hover:text-[#203B5C] dark:group-hover:text-[#BFC9D6] transition-colors line-clamp-1">
              {work.title}
            </h3>
          </div>

          <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] mt-0.5 font-medium">
            {work.author}
          </p>

          <p className="mt-2 text-xs text-[#5A6D82] dark:text-[#BFC9D6]/80 line-clamp-2 leading-relaxed">
            {work.synopsis}
          </p>

          {/* Optional inline warning notice if work has advisories */}
          {work.contentWarnings && work.contentWarnings.length > 0 && (
            <div className="mt-2.5">
              <ContentWarning warnings={work.contentWarnings} size="sm" />
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="mt-4 pt-3 border-t border-[#D8E2ED] dark:border-[#203B5C]/60 flex items-center justify-between text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
          <div className="flex items-center gap-1.5">
            <span>{work.chaptersCount} cap.</span>
            <span aria-hidden="true">·</span>
            <span>{work.readTime}</span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[#0B1220] dark:text-[#F8FAFC]">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{work.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

