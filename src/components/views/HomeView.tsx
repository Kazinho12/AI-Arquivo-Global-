/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Work, Author, WorkFormat } from '../../types';
import { MOCK_WORKS, MOCK_AUTHORS } from '../../data/mockData';
import { WorkCard } from '../cards/WorkCard';
import { AuthorCard } from '../cards/AuthorCard';
import { Button } from '../ui/Button';
import { FormatBadge, AgeRatingBadge } from '../ui/Badge';
import { BookOpen, Sparkles, ArrowRight, Compass, Shield, Feather, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface HomeViewProps {
  onSelectWork: (work: Work) => void;
  onSelectAuthor?: (author: Author) => void;
  onNavigateToCatalog: (format?: WorkFormat | 'all') => void;
  onNavigateToDesignSystem: () => void;
  onOpenPublishModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectWork,
  onSelectAuthor,
  onNavigateToCatalog,
  onNavigateToDesignSystem,
  onOpenPublishModal,
}) => {
  const { showToast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<WorkFormat | 'all'>('all');

  const featuredWork = MOCK_WORKS[0]; // "O Último Farol Abissal"

  const filteredWorks = selectedFormat === 'all'
    ? MOCK_WORKS
    : MOCK_WORKS.filter((w) => w.format === selectedFormat);

  const formatButtons: { id: WorkFormat | 'all'; label: string }[] = [
    { id: 'all', label: 'Todas as Obras' },
    { id: 'romance', label: 'Romances' },
    { id: 'conto', label: 'Contos' },
    { id: 'poesia', label: 'Poesia' },
    { id: 'hq', label: 'Banda Desenhada' },
    { id: 'manga', label: 'Mangás' },
  ];

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* SECTION 1: Editorial Focal Hero */}
      <section className="relative overflow-hidden pt-6 pb-8 lg:py-12 border-b border-[#D8E2ED] dark:border-[#203B5C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Quiet Curatorial Kicker */}
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#5A6D82] dark:text-[#BFC9D6]">
                <span>Destaque Editorial</span>
                <span aria-hidden="true">·</span>
                <span>Registo N.º 2026.04</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#203B5C] dark:text-[#F8FAFC] font-semibold">Seleção do Arquivo</span>
              </div>

              {/* Dominant Headline */}
              <h1 className="font-title text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0B1220] dark:text-[#F8FAFC] leading-[1.08] [text-wrap:balance]">
                {featuredWork.title}
              </h1>

              {/* Deck & Synopsis */}
              <p className="text-base sm:text-lg text-[#5A6D82] dark:text-[#E7EDF5] font-normal leading-relaxed max-w-2xl">
                {featuredWork.synopsis}
              </p>

              {/* Author & Curatorial Metadata */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
                <span className="font-medium text-[#0B1220] dark:text-[#F8FAFC]">Por {featuredWork.author}</span>
                <span aria-hidden="true">·</span>
                <span>{featuredWork.chaptersCount} capítulos</span>
                <span aria-hidden="true">·</span>
                <span>{featuredWork.readTime}</span>
                <span aria-hidden="true">·</span>
                <FormatBadge format={featuredWork.format} />
                <AgeRatingBadge rating={featuredWork.ageRating} />
              </div>

              {/* Primary Call to Actions */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onSelectWork(featuredWork)}
                  leftIcon={<BookOpen className="w-4 h-4" />}
                >
                  Abrir Ficha & Leitura
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => onNavigateToCatalog('all')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Explorar Catálogo Completo
                </Button>
              </div>

            </div>

            {/* Right Visual Anchor: 3:4 Cover Presentation */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div
                onClick={() => onSelectWork(featuredWork)}
                className="group relative w-full max-w-sm aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-[#D8E2ED] dark:border-[#203B5C] cursor-pointer bg-[#0B1220]"
              >
                <img
                  src={featuredWork.coverUrl}
                  alt={featuredWork.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Ambient Scrim for Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-transparent to-transparent opacity-60 pointer-events-none" />

                {/* Demo Notice */}
                <div className="absolute bottom-3 inset-x-3 bg-[#0B1220]/85 backdrop-blur-xs py-1 px-3 text-center rounded border border-white/10">
                  <p className="text-[10px] font-mono tracking-wider text-[#BFC9D6] uppercase">
                    Capa de Demonstração Editorial · Arquivo Global
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Institutional Metric Strip */}
          <div className="mt-14 pt-8 border-t border-[#D8E2ED] dark:border-[#203B5C] grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1220] dark:text-[#F8FAFC] tabular-nums">
                100%
              </p>
              <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] mt-0.5">
                Autonomia e Direitos aos Autores
              </p>
            </div>

            <div>
              <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1220] dark:text-[#F8FAFC] tabular-nums">
                5 Formatos
              </p>
              <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] mt-0.5">
                Romances, Contos, Poesia, HQ e Mangá
              </p>
            </div>

            <div>
              <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1220] dark:text-[#F8FAFC] tabular-nums">
                Dual Theme
              </p>
              <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] mt-0.5">
                Azul Abissal & Gelo Alabastro
              </p>
            </div>

            <div>
              <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1220] dark:text-[#F8FAFC] tabular-nums">
                Independente
              </p>
              <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] mt-0.5">
                Sem Barreiras Nem Algoritmos Opacos
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: Catalog Showcase with Filter Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8E2ED] dark:border-[#203B5C]">
          <div>
            <span className="text-xs uppercase tracking-widest font-mono text-[#5A6D82] dark:text-[#BFC9D6]">
              Catálogo em Destaque
            </span>
            <h2 className="font-title text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1220] dark:text-[#F8FAFC] mt-1">
              Obras Recentes & Acervo Curatorial
            </h2>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#E7EDF5] dark:bg-[#14243B] rounded-lg border border-[#D8E2ED] dark:border-[#203B5C]">
            {formatButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setSelectedFormat(btn.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedFormat === btn.id
                    ? 'bg-[#FFFFFF] dark:bg-[#203B5C] text-[#0B1220] dark:text-[#F8FAFC] shadow-sm font-semibold'
                    : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Works Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWorks.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              onSelect={onSelectWork}
            />
          ))}
        </div>

        {/* View All CTA */}
        <div className="mt-10 text-center">
          <Button
            variant="outline"
            size="md"
            onClick={() => onNavigateToCatalog(selectedFormat)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Ver Todas as Obras em Catálogo
          </Button>
        </div>

      </section>

      {/* SECTION 3: Curatorial Highlight (Asymmetric Essay / Literature Focus) */}
      <section className="bg-[#FFFFFF] dark:bg-[#14243B] border-y border-[#D8E2ED] dark:border-[#203B5C] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-4 space-y-4">
              <span className="text-xs uppercase tracking-widest font-mono text-[#5A6D82] dark:text-[#BFC9D6]">
                Curadoria Editorial
              </span>
              <h3 className="font-title text-3xl font-bold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
                O Silêncio como Território Poético
              </h3>
              <p className="text-sm text-[#5A6D82] dark:text-[#BFC9D6] leading-relaxed">
                No Arquivo Global, a poesia e os contos recebem o mesmo tratamento tipográfico e cuidado visual que as grandes publicações encadernadas. A diagramação respeita as pausas e a respiração do texto.
              </p>
              
              <div className="pt-2">
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => onSelectWork(MOCK_WORKS[3])} // Círculos de Prata
                  leftIcon={<Feather className="w-3.5 h-3.5" />}
                >
                  Conhecer &quot;Círculos de Prata&quot;
                </Button>
              </div>
            </div>

            <div className="lg:col-span-8 p-6 sm:p-8 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#D8E2ED] dark:border-[#203B5C]">
              <blockquote className="font-literary text-xl sm:text-2xl italic leading-relaxed text-[#0B1220] dark:text-[#F8FAFC] [text-wrap:balance]">
                &quot;Não há peso na pedra que a água esquece. Entre o azul do fundo e a prata da margem, o silêncio não pede licença para existir: apenas respira.&quot;
              </blockquote>
              <div className="mt-4 pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C] flex items-center justify-between text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
                <span className="font-semibold text-[#0B1220] dark:text-[#F8FAFC]">Clara von Holst</span>
                <span className="font-mono text-[11px]">Excerto do Canto VII · Funchal, Madeira</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 4: Independent Creators Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-6 border-b border-[#D8E2ED] dark:border-[#203B5C]">
          <div>
            <span className="text-xs uppercase tracking-widest font-mono text-[#5A6D82] dark:text-[#BFC9D6]">
              Comunidade Criativa
            </span>
            <h2 className="font-title text-3xl font-bold tracking-tight text-[#0B1220] dark:text-[#F8FAFC] mt-1">
              Criadores Independentes
            </h2>
          </div>
          <span className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] hidden sm:inline">
            Escritores, Roteiristas, Ilustradores & Mangakás
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_AUTHORS.map((author) => (
            <AuthorCard
              key={author.id}
              author={author}
              onSelectAuthor={onSelectAuthor}
            />
          ))}
        </div>
      </section>

      {/* SECTION 5: Creator Submission Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="p-8 sm:p-12 rounded-2xl bg-[#14243B] text-[#F8FAFC] border border-[#203B5C] relative overflow-hidden shadow-xl">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#203B5C]/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs uppercase tracking-widest font-mono text-[#BFC9D6]">
              Chamada para Escritores e Artistas
            </span>
            <h3 className="font-title text-3xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC]">
              Deseja publicar as suas obras no Arquivo Global?
            </h3>
            <p className="text-sm text-[#E7EDF5] leading-relaxed">
              Aceitamos submissões em cinco formatos essenciais: romance, conto, poesia, banda desenhada e mangá. O criador mantém todos os direitos sobre a sua obra, licença e publicação.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={onOpenPublishModal}
                leftIcon={<Feather className="w-4 h-4" />}
              >
                Submeter Minha Obra
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={onNavigateToDesignSystem}
                className="text-[#F8FAFC] border-[#BFC9D6]/40 hover:bg-[#203B5C]"
              >
                Avaliar Identidade & Tokens
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
