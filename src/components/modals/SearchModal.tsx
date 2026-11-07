/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { MOCK_WORKS, MOCK_AUTHORS } from '../../data/mockData';
import { Work, Author } from '../../types';
import { Search, BookOpen, User, ArrowRight } from 'lucide-react';
import { SearchBar } from '../ui/SearchBar';
import { FormatBadge } from '../ui/Badge';

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWork: (work: Work) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectWork,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const matchedWorks = query.trim()
    ? MOCK_WORKS.filter(
        (w) =>
          w.title.toLowerCase().includes(query.toLowerCase()) ||
          w.author.toLowerCase().includes(query.toLowerCase()) ||
          w.genres.some((g) => g.toLowerCase().includes(query.toLowerCase()))
      )
    : MOCK_WORKS.slice(0, 4);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pesquisa Rápida no Arquivo"
      subtitle="Obras, Autores e Formatos"
      maxWidth="lg"
    >
      <div className="space-y-5 text-left">
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          placeholder="Comece a escrever para pesquisar no Arquivo..."
          autoFocus
        />

        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#5A6D82] dark:text-[#BFC9D6]">
            {query.trim() ? `Resultados (${matchedWorks.length})` : 'Sugestões do Acervo'}
          </p>

          <div className="divide-y divide-[#D8E2ED] dark:divide-[#203B5C] border border-[#D8E2ED] dark:border-[#203B5C] rounded-lg overflow-hidden">
            {matchedWorks.map((work) => (
              <button
                key={work.id}
                type="button"
                onClick={() => {
                  onSelectWork(work);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-[#E7EDF5] dark:hover:bg-[#203B5C]/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-12 rounded bg-[#E7EDF5] dark:bg-[#0B1220] overflow-hidden shrink-0 border border-[#D8E2ED] dark:border-[#203B5C]">
                    {work.coverUrl ? (
                      <img
                        src={work.coverUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-mono">
                        {work.format.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-title text-base font-bold text-[#0B1220] dark:text-[#F8FAFC] truncate group-hover:text-[#203B5C] dark:group-hover:text-[#BFC9D6]">
                      {work.title}
                    </p>
                    <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] truncate">
                      {work.author} · {work.format.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <FormatBadge format={work.format} />
                  <ArrowRight className="w-4 h-4 text-[#5A6D82] dark:text-[#BFC9D6] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}

            {matchedWorks.length === 0 && (
              <div className="p-6 text-center text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
                Nenhuma obra encontrada para &quot;{query}&quot;.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
