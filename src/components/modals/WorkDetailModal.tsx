import React, { useState } from 'react';
import { Work } from '../../types';
import { Modal } from '../ui/Modal';
import { FormatBadge, StatusBadge } from '../ui/Badge';
import { AgeRating } from '../ui/AgeRating';
import { ContentWarning } from '../ui/ContentWarning';
import { GenreLabel } from '../ui/GenreLabel';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  Bookmark,
  Share2,
  Calendar,
  Clock,
  Layers,
  ShieldCheck,
  Type,
  ExternalLink,
} from 'lucide-react';

export interface WorkDetailModalProps {
  work: Work | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkDetailModal: React.FC<WorkDetailModalProps> = ({
  work,
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'reading'>('details');
  const [readingFontSize, setReadingFontSize] = useState<'normal' | 'large'>('normal');
  const [isSaved, setIsSaved] = useState(false);

  if (!work) return null;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Ligação copiada', 'A hiperligação para esta obra foi copiada para a área de transferência.', 'success');
  };

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    showToast(
      isSaved ? 'Obra removida' : 'Obra guardada',
      isSaved ? `"${work.title}" removida da sua biblioteca.` : `"${work.title}" guardada na sua estante.`,
      'success'
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={work.title}
      subtitle={`Ficha Editorial & Amostra · Arquivo Global`}
      maxWidth="3xl"
    >
      {/* Top Segmented Navigation Tab */}
      <div className="flex items-center gap-2 p-1 bg-[#E7EDF5] dark:bg-[#0B1220] rounded-lg mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === 'details'
              ? 'bg-[#FFFFFF] dark:bg-[#14243B] text-[#0B1220] dark:text-[#F8FAFC] shadow-sm'
              : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC]'
          }`}
        >
          Ficha da Obra & Sinopse
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reading')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === 'reading'
              ? 'bg-[#FFFFFF] dark:bg-[#14243B] text-[#0B1220] dark:text-[#F8FAFC] shadow-sm'
              : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC]'
          }`}
        >
          Amostra de Leitura Curatorial
        </button>
      </div>

      {activeTab === 'details' ? (
        <div className="space-y-6">
          {/* Main Hero Summary with Cover & Meta */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Cover Frame */}
            <div className="relative w-full sm:w-48 aspect-[3/4] rounded-lg overflow-hidden shrink-0 bg-[#E7EDF5] dark:bg-[#0B1220] border border-[#D8E2ED] dark:border-[#203B5C] shadow-md">
              {work.coverUrl ? (
                <img
                  src={work.coverUrl}
                  alt={work.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full p-4 flex flex-col justify-between bg-[#14243B] text-[#F8FAFC]">
                  <FormatBadge format={work.format} />
                  <p className="font-title text-lg font-bold">{work.title}</p>
                  <p className="text-xs text-[#BFC9D6]">{work.author}</p>
                </div>
              )}
              {work.isDemoCover && (
                <span className="absolute bottom-1.5 inset-x-1.5 text-[8px] font-mono tracking-tighter text-center py-0.5 bg-[#0B1220]/80 text-[#BFC9D6] rounded">
                  Demonstração Editorial
                </span>
              )}
            </div>

            {/* Core Info */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <FormatBadge format={work.format} variant="filled" />
                <AgeRating rating={work.ageRating} size="md" showLabel />
                <StatusBadge status={work.status} />
              </div>

              <div>
                <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] uppercase tracking-wider font-mono">Autor / Criador</p>
                <p className="text-base font-semibold text-[#0B1220] dark:text-[#F8FAFC]">{work.author}</p>
              </div>

              <div>
                <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] uppercase tracking-wider font-mono mb-1">Sinopse</p>
                <p className="text-sm text-[#0B1220] dark:text-[#E7EDF5] leading-relaxed">
                  {work.synopsis}
                </p>
              </div>

              {/* Content Warnings */}
              {work.contentWarnings && work.contentWarnings.length > 0 && (
                <div className="pt-1">
                  <ContentWarning warnings={work.contentWarnings} expandable />
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-1.5">
                {work.genres.map((g) => (
                  <GenreLabel key={g} genre={g} size="sm" />
                ))}
              </div>
            </div>
          </div>

          {/* Archival Metadata Table (Pattern from Editorial Design Reference) */}
          <div className="border border-[#D8E2ED] dark:border-[#203B5C] rounded-lg divide-y divide-[#D8E2ED] dark:divide-[#203B5C] text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 p-3 bg-[#F8FAFC] dark:bg-[#0B1220]/50 text-[#5A6D82] dark:text-[#BFC9D6]">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Extensão:</span>
                <span className="font-semibold text-[#0B1220] dark:text-[#F8FAFC]">{work.chaptersCount} capítulos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Tempo médio:</span>
                <span className="font-semibold text-[#0B1220] dark:text-[#F8FAFC]">{work.readTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Publicação:</span>
                <span className="font-semibold text-[#0B1220] dark:text-[#F8FAFC]">{work.publishedAt}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Licença:</span>
                <span className="font-semibold text-[#0B1220] dark:text-[#F8FAFC] truncate" title={work.license}>
                  {work.license}
                </span>
              </div>
            </div>
          </div>

          {/* Action Strip */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#D8E2ED] dark:border-[#203B5C]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant={isSaved ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleSaveToggle}
                leftIcon={<Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />}
              >
                {isSaved ? 'Guardado na Estante' : 'Guardar na Estante'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                leftIcon={<Share2 className="w-3.5 h-3.5" />}
              >
                Partilhar
              </Button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('reading')}
              leftIcon={<BookOpen className="w-3.5 h-3.5" />}
            >
              Abrir Amostra de Leitura
            </Button>
          </div>
        </div>
      ) : (
        /* Reading Experience */
        <div className="space-y-6">
          {/* Reading Controls */}
          <div className="flex items-center justify-between py-2 border-b border-[#D8E2ED] dark:border-[#203B5C] text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
            <div className="flex items-center gap-2">
              <span className="uppercase font-mono tracking-wider">Amostra do Arquivo</span>
              <span>·</span>
              <span>{work.sampleExcerpt?.chapterTitle || 'Excerto da Obra'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReadingFontSize(readingFontSize === 'normal' ? 'large' : 'normal')}
                className="flex items-center gap-1 px-2 py-1 rounded border border-[#D8E2ED] dark:border-[#203B5C] hover:bg-[#E7EDF5] dark:hover:bg-[#203B5C] transition-colors"
              >
                <Type className="w-3.5 h-3.5" />
                <span>{readingFontSize === 'normal' ? 'Texto Maior' : 'Texto Normal'}</span>
              </button>
            </div>
          </div>

          {/* Reading Text Column constrained to 65-75ch as per constitution */}
          <div
            className={`max-w-2xl mx-auto space-y-5 font-literary leading-relaxed text-[#0B1220] dark:text-[#F8FAFC] ${
              readingFontSize === 'large' ? 'text-lg sm:text-xl leading-loose' : 'text-base sm:text-lg leading-relaxed'
            }`}
          >
            <h3 className="font-title text-xl sm:text-2xl font-bold tracking-tight mb-4 border-b border-[#D8E2ED] dark:border-[#203B5C] pb-2">
              {work.sampleExcerpt?.chapterTitle}
            </h3>

            {work.sampleExcerpt?.text.map((paragraph, index) => (
              <p
                key={index}
                className={
                  index === 0 && work.format !== 'hq' && work.format !== 'manga'
                    ? 'first-letter:text-4xl first-letter:font-title first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:text-[#203B5C] dark:first-letter:text-[#BFC9D6]'
                    : ''
                }
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Reader Footer Note */}
          <div className="mt-8 pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
            <p>Fim da amostra de demonstração editorial para este registo.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('details')}
            >
              Voltar à Ficha da Obra
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
