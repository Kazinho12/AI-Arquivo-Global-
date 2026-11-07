/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Work, WorkFormat, AgeRating, WorkStatus } from '../../types';
import { MOCK_WORKS, FORMAT_LABELS } from '../../data/mockData';
import { WorkCard } from '../cards/WorkCard';
import { WorkCardSkeleton } from '../ui/Skeleton';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { SearchBar } from '../ui/SearchBar';
import { FilterPanel } from '../ui/FilterPanel';
import { Pagination } from '../ui/Pagination';
import { Button } from '../ui/Button';
import { LayoutGrid, List, SlidersHorizontal, RotateCcw, Eye } from 'lucide-react';

export interface CatalogViewProps {
  initialFormat?: WorkFormat | 'all';
  onSelectWork: (work: Work) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  initialFormat = 'all',
  onSelectWork,
}) => {
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState<WorkFormat | 'all'>(initialFormat);
  const [ageRating, setAgeRating] = useState<AgeRating | 'all'>('all');
  const [status, setStatus] = useState<WorkStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent');
  const [hideExplicit, setHideExplicit] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Design System Evaluation Toggles
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [simulateError, setSimulateError] = useState(false);

  const filteredWorks = useMemo(() => {
    return MOCK_WORKS.filter((work) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = work.title.toLowerCase().includes(query);
        const matchesAuthor = work.author.toLowerCase().includes(query);
        const matchesSynopsis = work.synopsis.toLowerCase().includes(query);
        const matchesGenres = work.genres.some((g) => g.toLowerCase().includes(query));
        if (!matchesTitle && !matchesAuthor && !matchesSynopsis && !matchesGenres) {
          return false;
        }
      }

      // Format
      if (format !== 'all' && work.format !== format) {
        return false;
      }

      // Age Rating
      if (ageRating !== 'all' && work.ageRating !== ageRating) {
        return false;
      }

      // Status
      if (status !== 'all' && work.status !== status) {
        return false;
      }

      // Explicit Content Filter
      if (hideExplicit && (work.ageRating === '18' || (work.contentWarnings && work.contentWarnings.length > 0))) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'popular') return b.viewsCount - a.viewsCount;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // default recent
    });
  }, [search, format, ageRating, status, sortBy, hideExplicit]);

  const totalPages = Math.ceil(filteredWorks.length / itemsPerPage);
  const paginatedWorks = filteredWorks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isModified = search !== '' || format !== 'all' || ageRating !== 'all' || status !== 'all' || sortBy !== 'recent' || hideExplicit;

  const handleResetFilters = () => {
    setSearch('');
    setFormat('all');
    setAgeRating('all');
    setStatus('all');
    setSortBy('recent');
    setHideExplicit(false);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Evaluation Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8E2ED] dark:border-[#203B5C]">
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-[#5A6D82] dark:text-[#BFC9D6]">
            Explorador de Obras
          </span>
          <h1 className="font-title text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1220] dark:text-[#F8FAFC] mt-1">
            Catálogo do Arquivo Global
          </h1>
          <p className="text-sm text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
            Filtre por formato editorial, classificação indicativa etária, avisos e estado de publicação.
          </p>
        </div>

        {/* State Simulator Strip */}
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-[#E7EDF5] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] text-xs">
          <span className="font-mono text-[11px] text-[#5A6D82] dark:text-[#BFC9D6] font-semibold">
            Testar Estados:
          </span>
          <button
            type="button"
            onClick={() => setSimulateLoading(!simulateLoading)}
            className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
              simulateLoading
                ? 'bg-[#14243B] text-[#F8FAFC] dark:bg-[#BFC9D6] dark:text-[#0B1220] font-bold'
                : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:bg-[#D8E2ED] dark:hover:bg-[#203B5C]'
            }`}
          >
            Carregamento
          </button>
          <button
            type="button"
            onClick={() => setSimulateError(!simulateError)}
            className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
              simulateError
                ? 'bg-rose-500 text-white font-bold'
                : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:bg-[#D8E2ED] dark:hover:bg-[#203B5C]'
            }`}
          >
            Erro de Rede
          </button>
        </div>
      </div>

      {/* SearchBar & Layout Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder="Pesquisar por título, autor, género ou palavra-chave..."
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant={showFilterPanel ? 'secondary' : 'outline'}
            size="md"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          >
            <span>Filtros</span>
            {isModified && (
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-1" />
            )}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-[#D8E2ED] dark:border-[#203B5C] p-0.5 bg-[#FFFFFF] dark:bg-[#14243B]">
            <button
              type="button"
              onClick={() => setLayout('grid')}
              className={`p-2 rounded-md transition-colors cursor-pointer ${
                layout === 'grid'
                  ? 'bg-[#14243B] text-[#F8FAFC] dark:bg-[#BFC9D6] dark:text-[#0B1220]'
                  : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC]'
              }`}
              title="Visualização em Grelha (3:4)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLayout('list')}
              className={`p-2 rounded-md transition-colors cursor-pointer ${
                layout === 'list'
                  ? 'bg-[#14243B] text-[#F8FAFC] dark:bg-[#BFC9D6] dark:text-[#0B1220]'
                  : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC]'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FilterPanel Component */}
      {showFilterPanel && (
        <FilterPanel
          selectedFormat={format}
          onFormatChange={(fmt) => {
            setFormat(fmt);
            setCurrentPage(1);
          }}
          selectedAgeRating={ageRating}
          onAgeRatingChange={(ar) => {
            setAgeRating(ar);
            setCurrentPage(1);
          }}
          selectedStatus={status}
          onStatusChange={(st) => {
            setStatus(st);
            setCurrentPage(1);
          }}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          hideExplicitContent={hideExplicit}
          onToggleHideExplicitContent={setHideExplicit}
          onReset={handleResetFilters}
          isModified={isModified}
        />
      )}
      {/* Results Count & Quick Status */}
      <div className="flex items-center justify-between text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
        <span className="tabular-nums font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
          {filteredWorks.length} obras encontradas no Arquivo
        </span>
        {isModified && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-[#203B5C] dark:text-[#BFC9D6] hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar filtros de pesquisa</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      {simulateError ? (
        <ErrorState
          title="Erro simulado de ligação ao catálogo"
          message="Este estado demonstra a resposta visual e acessível caso a futura API do Supabase retorne um código de erro ou ocorra falha de rede."
          onRetry={() => setSimulateError(false)}
        />
      ) : simulateLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <WorkCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredWorks.length === 0 ? (
        <EmptyState
          title="Nenhuma obra corresponde aos critérios"
          message={`Não foram encontrados registos para "${search || format}". Tente escolher outro formato ou reiniciar os filtros.`}
          onReset={handleResetFilters}
        />
      ) : (
        <>
          <div
            className={
              layout === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {paginatedWorks.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                onSelect={onSelectWork}
                layout={layout}
              />
            ))}
          </div>

          {/* Interactive Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredWorks.length}
            itemsPerPage={itemsPerPage}
          />
        </>
      )}

    </div>
  );
};
