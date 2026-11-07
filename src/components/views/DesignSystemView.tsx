/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { COLOR_TOKENS, AGE_RATINGS_INFO, MOCK_WORKS, MOCK_AUTHORS } from '../../data/mockData';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SearchBar } from '../ui/SearchBar';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Textarea } from '../ui/Textarea';
import { Tooltip } from '../ui/Tooltip';
import { Modal } from '../ui/Modal';
import { Dropdown } from '../ui/Dropdown';
import { AgeRating } from '../ui/AgeRating';
import { FormatBadge, StatusBadge } from '../ui/Badge';
import { Tag } from '../ui/Tag';
import { GenreLabel } from '../ui/GenreLabel';
import { ContentWarning } from '../ui/ContentWarning';
import { WorkCard } from '../cards/WorkCard';
import { AuthorCard } from '../cards/AuthorCard';
import { FilterPanel } from '../ui/FilterPanel';
import { Pagination } from '../ui/Pagination';
import { Notification } from '../ui/Notification';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Navigation, NavigationModule } from '../layout/Navigation';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Copy,
  Check,
  Sparkles,
  Layers,
  Palette,
  Type,
  Component as ComponentIcon,
  Moon,
  Sun,
  Send,
  Eye,
  SlidersHorizontal,
  Bookmark,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  Maximize2,
} from 'lucide-react';
import { AgeRating as AgeRatingType, WorkFormat, WorkStatus } from '../../types';

export const DesignSystemView: React.FC = () => {
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  // Active section tab within Design System
  const [activeDsSection, setActiveDsSection] = useState<
    'tokens' | 'typography' | 'buttons' | 'forms' | 'metadata' | 'navigation' | 'cards' | 'feedback'
  >('tokens');

  // Copy code feedback
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Playground state for buttons
  const [buttonLoading, setButtonLoading] = useState(false);

  // Playground state for forms
  const [demoInput, setDemoInput] = useState('');
  const [demoSearch, setDemoSearch] = useState('farol abissal');
  const [demoSelect, setDemoSelect] = useState('romance');
  const [demoCheckbox1, setDemoCheckbox1] = useState(true);
  const [demoCheckbox2, setDemoCheckbox2] = useState(false);
  const [demoCheckboxIndeterminate, setDemoCheckboxIndeterminate] = useState(true);
  const [demoTextarea, setDemoTextarea] = useState(
    'O Arquivo Global estabelece um ecossistema independente de publicação para criadores literários, quadrinistas e mangakás.'
  );

  // Filter & Navigation playground
  const [demoActiveNav, setDemoActiveNav] = useState<NavigationModule>('design-system');
  const [demoFormat, setDemoFormat] = useState<WorkFormat | 'all'>('all');
  const [demoAgeRating, setDemoAgeRating] = useState<AgeRatingType | 'all'>('all');
  const [demoStatus, setDemoStatus] = useState<WorkStatus | 'all'>('all');
  const [demoSort, setDemoSort] = useState<'recent' | 'popular' | 'rating'>('recent');
  const [demoHideExplicit, setDemoHideExplicit] = useState(false);
  const [demoPage, setDemoPage] = useState(1);

  // Genre Label interactive state
  const [selectedGenre, setSelectedGenre] = useState<string>('Ficção Científica');

  // Modal demo state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Inline Notification dismiss state
  const [showNotification, setShowNotification] = useState(true);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    showToast('Código HEX copiado', `${hex} copiado para a área de transferência.`, 'info');
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const triggerToast = (type: 'success' | 'info' | 'warning' | 'error') => {
    const titles = {
      success: 'Obra catalogada com sucesso',
      info: 'Nova atualização editorial disponível',
      warning: 'Capítulo com avisos pendentes de revisão',
      error: 'Falha temporária ao sincronizar registos',
    };
    showToast(titles[type], 'Exemplo de notificação do Toast Provider do AG.', type);
  };

  const dsSections = [
    { id: 'tokens', label: '1. Cores & Tokens', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'typography', label: '2. Tipografia', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'buttons', label: '3. Botões', icon: <ComponentIcon className="w-3.5 h-3.5" /> },
    { id: 'forms', label: '4. Formulários & Busca', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { id: 'metadata', label: '5. Badges & Avisos', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { id: 'navigation', label: '6. Navegação & Filtros', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'cards', label: '7. Cartões de Obras', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'feedback', label: '8. Estados & Feedback', icon: <Info className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Top Banner & Theme Switch */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#14243B] dark:bg-[#14243B] text-[#F8FAFC] border border-[#203B5C] relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#203B5C]/60 text-xs font-mono uppercase tracking-widest text-[#BFC9D6]">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Design System v0.1 · Documentação & Test Bench</span>
            </div>
            <h1 className="font-title text-3xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC]">
              Arquivo Global Design System
            </h1>
            <p className="text-sm text-[#E7EDF5] max-w-2xl leading-relaxed">
              Fundação visual e estrutural para publicação independente de obras literárias, quadrinhos e mangás. Ambiente completo para inspeção de tokens, componentes, estados e comportamentos responsivos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={toggleTheme}
              leftIcon={theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            >
              <span>{theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Internal Navigation Bar for Design System Sections */}
      <div className="sticky top-16 z-30 bg-[#FFFFFF]/90 dark:bg-[#0B1220]/90 backdrop-blur-md py-2 border-b border-[#D8E2ED] dark:border-[#203B5C] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {dsSections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveDsSection(sec.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeDsSection === sec.id
                  ? 'bg-[#14243B] text-[#F8FAFC] dark:bg-[#BFC9D6] dark:text-[#0B1220] font-bold shadow-xs'
                  : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:bg-[#E7EDF5] dark:hover:bg-[#14243B]'
              }`}
            >
              {sec.icon}
              <span>{sec.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: CORES & TOKENS */}
      {activeDsSection === 'tokens' && (
        <section className="space-y-8 animate-in fade-in duration-200">
          <div>
            <h2 className="font-title text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
              Paleta Principal de Tokens
            </h2>
            <p className="text-sm text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
              Valores estritos especificados no briefing, com contraste certificado WCAG e papéis semânticos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {COLOR_TOKENS.map((token) => (
              <div
                key={token.hex}
                className="rounded-xl overflow-hidden bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] shadow-xs flex flex-col justify-between"
              >
                <div
                  className="h-28 w-full relative p-4 flex items-end justify-between border-b border-[#D8E2ED] dark:border-[#203B5C]"
                  style={{ backgroundColor: token.hex }}
                >
                  <span
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded shadow-xs"
                    style={{
                      backgroundColor:
                        token.hex === '#0B1220' || token.hex === '#14243B' || token.hex === '#203B5C'
                          ? 'rgba(255,255,255,0.15)'
                          : 'rgba(0,0,0,0.15)',
                      color:
                        token.hex === '#0B1220' || token.hex === '#14243B' || token.hex === '#203B5C'
                          ? '#F8FAFC'
                          : '#0B1220',
                    }}
                  >
                    {token.hex}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopyHex(token.hex)}
                    className="p-1.5 rounded bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
                    title="Copiar código HEX"
                  >
                    {copiedHex === token.hex ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-title text-base font-bold text-[#0B1220] dark:text-[#F8FAFC]">
                        {token.name}
                      </h3>
                      <span className="text-[11px] font-mono text-[#5A6D82] dark:text-[#BFC9D6]">
                        {token.namePt}
                      </span>
                    </div>

                    <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] mt-1.5 leading-relaxed">
                      {token.role}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#D8E2ED] dark:border-[#203B5C]/60 flex items-center justify-between text-[11px] text-[#5A6D82] dark:text-[#BFC9D6]">
                    <span className="font-mono">{token.wcagContrast}</span>
                    <span className="text-emerald-500 font-semibold">Conforme</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Semantic State Colors */}
          <div className="pt-6 border-t border-[#D8E2ED] dark:border-[#203B5C] space-y-4">
            <h3 className="font-title text-lg font-bold text-[#0B1220] dark:text-[#F8FAFC]">
              Tokens Semânticos de Estado (Sucesso, Erro, Aviso, Informação)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sucesso (Success)</span>
                </div>
                <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
                  Confirmação de publicação, obra guardada, filtros aplicados.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/30">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Erro (Error)</span>
                </div>
                <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
                  Falhas de validação, campos obrigatórios, erro de rede.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Aviso (Warning)</span>
                </div>
                <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
                  Avisos de conteúdo sensível, classificação etária madura.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/10 dark:bg-sky-950/30">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-sm">
                  <Info className="w-4 h-4" />
                  <span>Informação (Info)</span>
                </div>
                <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
                  Notas de licenciamento, orientações da comunidade, novos capítulos.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: TIPOGRAFIA */}
      {activeDsSection === 'typography' && (
        <section className="space-y-8 animate-in fade-in duration-200">
          <div>
            <h2 className="font-title text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
              Hierarquia Tipográfica Oficial (4 Famílias)
            </h2>
            <p className="text-sm text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
              Atribuídas de forma estrita para títulos, interface, leitura literária e dados técnicos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Space Grotesk */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#5A6D82] dark:text-[#BFC9D6]">
                Títulos & Destaques
              </span>
              <h3 className="font-title text-3xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
                Space Grotesk
              </h3>
              <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] leading-relaxed">
                Sans-serif de traço geométrico e expressivo, trazendo modernidade tecnológica e impacto aos títulos de obras, secções e botões de destaque.
              </p>
              <div className="pt-2 font-title space-y-1 text-sm border-t border-[#D8E2ED] dark:border-[#203B5C]">
                <p className="font-bold text-lg">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                <p className="font-medium text-base">abcdefghijklmnopqrstuvwxyz 0123456789</p>
              </div>
            </div>

            {/* Inter */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#5A6D82] dark:text-[#BFC9D6]">
                Interface & Textos Gerais
              </span>
              <h3 className="font-sans text-3xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
                Inter
              </h3>
              <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] leading-relaxed">
                Tipografia neutra de alta legibilidade em todas as densidades de píxeis. Ideal para menus, etiquetas de formulário, campos de busca e microtextos.
              </p>
              <div className="pt-2 font-sans space-y-1 text-sm border-t border-[#D8E2ED] dark:border-[#203B5C]">
                <p className="font-semibold text-lg">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                <p className="font-normal text-base">abcdefghijklmnopqrstuvwxyz 0123456789</p>
              </div>
            </div>

            {/* Source Serif 4 */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#5A6D82] dark:text-[#BFC9D6]">
                Leitura Literária & Prosa
              </span>
              <h3 className="font-literary text-3xl font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                Source Serif 4
              </h3>
              <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] leading-relaxed">
                Serifa literária elegante e confortável. Projetada para longos períodos de imersão textual em romances, contos, ensaios e poesia.
              </p>
              <div className="pt-2 font-literary space-y-1 text-sm border-t border-[#D8E2ED] dark:border-[#203B5C]">
                <p className="font-bold text-lg">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                <p className="italic text-base">Água viva, maré de vidro, silêncios nas rochas atlânticas.</p>
              </div>
            </div>

            {/* JetBrains Mono */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#5A6D82] dark:text-[#BFC9D6]">
                Conteúdo Técnico & Metadados
              </span>
              <h3 className="font-mono text-3xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
                JetBrains Mono
              </h3>
              <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] leading-relaxed">
                Monoespaçada cristalina com suporte a numerais tabulares. Usada para números de capítulos, datas, tempos de leitura e códigos de registo do Arquivo.
              </p>
              <div className="pt-2 font-mono space-y-1 text-xs border-t border-[#D8E2ED] dark:border-[#203B5C]">
                <p className="font-bold">REG_ID: AG-2026-04 · 14.850 VIEWS</p>
                <p className="opacity-80">{"{ format: 'romance', age_rating: '14' }"}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: BOTÕES */}
      {activeDsSection === 'buttons' && (
        <section className="space-y-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-title text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
                Componente Button: Variantes e Estados
              </h2>
              <p className="text-sm text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
                Construído com razão 2:1 de preenchimento horizontal/vertical e suporte a loading.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setButtonLoading(!buttonLoading)}
            >
              {buttonLoading ? 'Desativar Loading' : 'Simular Loading'}
            </Button>
          </div>

          <div className="p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] space-y-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-3">
                Variantes Principais:
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" isLoading={buttonLoading} onClick={() => triggerToast('success')}>
                  Primário (Primary)
                </Button>
                <Button variant="secondary" isLoading={buttonLoading} onClick={() => triggerToast('info')}>
                  Secundário (Secondary)
                </Button>
                <Button variant="outline" isLoading={buttonLoading} onClick={() => triggerToast('warning')}>
                  Outline
                </Button>
                <Button variant="ghost" isLoading={buttonLoading} onClick={() => triggerToast('error')}>
                  Ghost
                </Button>
                <Button variant="subtle" isLoading={buttonLoading}>
                  Subtle
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C]">
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-3">
                Tamanhos Padronizados (sm, md, lg):
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="primary">
                  Pequeno (sm)
                </Button>
                <Button size="md" variant="primary">
                  Padrão (md)
                </Button>
                <Button size="lg" variant="primary">
                  Grande (lg)
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C]">
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-3">
                Com Ícones e Estados Desativados:
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" leftIcon={<BookOpen className="w-4 h-4" />}>
                  Com Ícone Esquerda
                </Button>
                <Button variant="outline" rightIcon={<Send className="w-4 h-4" />}>
                  Com Ícone Direita
                </Button>
                <Button variant="primary" disabled>
                  Desativado (Disabled)
                </Button>
                <Button variant="secondary" disabled>
                  Secundário Desativado
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: FORMULÁRIOS & BUSCA */}
      {activeDsSection === 'forms' && (
        <section className="space-y-8 animate-in fade-in duration-200">
          <div>
            <h2 className="font-title text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
              Componentes de Formulário & Entrada
            </h2>
            <p className="text-sm text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
              SearchBar, Input, Select, Checkbox e Textarea com validação visual e foco de alta precisão.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] space-y-6">
            {/* SearchBar */}
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-2">
                SearchBar com Atalho (⌘K / Ctrl+K):
              </p>
              <SearchBar
                value={demoSearch}
                onChange={setDemoSearch}
                placeholder="Pesquisar obras no Arquivo..."
              />
            </div>

            {/* Inputs & Select */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <Input
                label="Input Normal com Helper"
                placeholder="Ex: Título da obra"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                helperText="Identificador principal no catálogo"
              />

              <Input
                label="Input com Estado de Erro"
                placeholder="Ex: autor@dominio.pt"
                defaultValue="autor@invalido"
                error="Formato de correio eletrónico inválido."
              />

              <Select
                label="Select com Chevron"
                options={[
                  { value: 'romance', label: 'Romance Literário' },
                  { value: 'conto', label: 'Conto & Ficção Curta' },
                  { value: 'poesia', label: 'Poesia' },
                  { value: 'hq', label: 'Banda Desenhada / HQ' },
                  { value: 'manga', label: 'Mangá' },
                ]}
                value={demoSelect}
                onChange={(e) => setDemoSelect(e.target.value)}
                helperText="Escolha a categoria principal"
              />
            </div>

            {/* Checkbox Group */}
            <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C] space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6]">
                Componente Checkbox (Acessível & Tipado):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Checkbox
                  label="Concordo com os termos do Arquivo"
                  description="Preservação de direitos de autor"
                  checked={demoCheckbox1}
                  onChange={(e) => setDemoCheckbox1(e.target.checked)}
                />
                <Checkbox
                  label="Ocultar obras sensíveis"
                  description="Filtro de leitura pessoal"
                  checked={demoCheckbox2}
                  onChange={(e) => setDemoCheckbox2(e.target.checked)}
                />
                <Checkbox
                  label="Estado Indeterminado"
                  description="Seleção parcial de capítulos"
                  indeterminate={demoCheckboxIndeterminate}
                  checked={demoCheckboxIndeterminate}
                  onChange={() => setDemoCheckboxIndeterminate(!demoCheckboxIndeterminate)}
                />
              </div>
            </div>

            {/* Textarea */}
            <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C]">
              <Textarea
                label="Textarea com Contador de Caracteres"
                value={demoTextarea}
                onChange={(e) => setDemoTextarea(e.target.value)}
                maxLength={250}
                currentLength={demoTextarea.length}
                helperText="Sinopse ou declaração do criador"
              />
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5: BADGES & AVISOS */}
      {activeDsSection === 'metadata' && (
        <section className="space-y-8 animate-in fade-in duration-200">
          <div>
            <h2 className="font-title text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
              Badges de Classificação, Avisos & Rótulos
            </h2>
            <p className="text-sm text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
              Classificação indicativa etária, avisos de conteúdo sensível, formatos e etiquetas de género.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] space-y-6">
            {/* Age Rating */}
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-2">
                Componente AgeRating (com Tooltip e Rótulos):
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <AgeRating rating="L" size="md" showLabel />
                <AgeRating rating="12" size="md" showLabel />
                <AgeRating rating="14" size="md" showLabel />
                <AgeRating rating="16" size="md" showLabel />
                <AgeRating rating="18" size="md" showLabel />
              </div>
            </div>

            {/* Content Warnings */}
            <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C] space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6]">
                Componente ContentWarning (Avisos de Conteúdo):
              </p>
              <div className="space-y-3 max-w-xl">
                <div>
                  <span className="text-[11px] text-[#5A6D82] dark:text-[#BFC9D6] block mb-1">
                    Modo Compacto (Inline em Cartão):
                  </span>
                  <ContentWarning warnings={['Claustrofobia', 'Isolamento']} />
                </div>

                <div>
                  <span className="text-[11px] text-[#5A6D82] dark:text-[#BFC9D6] block mb-1">
                    Modo Expandível (Para Fichas de Obra):
                  </span>
                  <ContentWarning
                    warnings={['Violência moderada', 'Temas psicológicos sensíveis', 'Luto familiar']}
                    expandable
                  />
                </div>
              </div>
            </div>

            {/* Genre Labels & Tags */}
            <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C] space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6]">
                Componente GenreLabel & Tag:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {['Ficção Científica', 'Mistério', 'Poesia Lírica', 'Seinen', 'Histórico', 'Drama'].map((g, i) => (
                  <GenreLabel
                    key={g}
                    genre={g}
                    count={(i + 1) * 3}
                    isActive={selectedGenre === g}
                    onClick={() => setSelectedGenre(g)}
                  />
                ))}
              </div>
            </div>

            {/* Status & Formats */}
            <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C]">
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-2">
                Formatos & Estados de Publicação:
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <FormatBadge format="romance" variant="filled" />
                <FormatBadge format="conto" variant="filled" />
                <FormatBadge format="poesia" variant="filled" />
                <FormatBadge format="hq" variant="filled" />
                <FormatBadge format="manga" variant="filled" />
                <span className="text-xs text-[#5A6D82] dark:text-[#BFC9D6]">|</span>
                <StatusBadge status="ongoing" />
                <StatusBadge status="completed" />
                <StatusBadge status="hiatus" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 6: NAVEGAÇÃO & FILTROS */}
      {activeDsSection === 'navigation' && (
        <section className="space-y-8 animate-in fade-in duration-200">
          <div>
            <h2 className="font-title text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
              Componentes de Navegação, Filtros & Estrutura
            </h2>
            <p className="text-sm text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
              Navigation contextual, FilterPanel modular, Pagination e Dropdown.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] space-y-8">
            {/* Contextual Navigation */}
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-3">
                Componente Navigation (Abas Especializadas):
              </p>
              <Navigation
                activeModule={demoActiveNav}
                onSelectModule={setDemoActiveNav}
              />
            </div>

            {/* FilterPanel Component */}
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-3">
                Componente FilterPanel:
              </p>
              <FilterPanel
                selectedFormat={demoFormat}
                onFormatChange={setDemoFormat}
                selectedAgeRating={demoAgeRating}
                onAgeRatingChange={setDemoAgeRating}
                selectedStatus={demoStatus}
                onStatusChange={setDemoStatus}
                sortBy={demoSort}
                onSortByChange={setDemoSort}
                hideExplicitContent={demoHideExplicit}
                onToggleHideExplicitContent={setDemoHideExplicit}
                onReset={() => {
                  setDemoFormat('all');
                  setDemoAgeRating('all');
                  setDemoStatus('all');
                  setDemoSort('recent');
                  setDemoHideExplicit(false);
                }}
                isModified={demoFormat !== 'all' || demoAgeRating !== 'all' || demoStatus !== 'all' || demoSort !== 'recent' || demoHideExplicit}
              />
            </div>

            {/* Pagination Component */}
            <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C]">
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-2">
                Componente Pagination:
              </p>
              <Pagination
                currentPage={demoPage}
                totalPages={4}
                onPageChange={setDemoPage}
                totalItems={24}
                itemsPerPage={6}
              />
            </div>

            {/* Dropdown & Tooltip */}
            <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C] flex flex-wrap items-center gap-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-2">
                  Dropdown:
                </p>
                <Dropdown
                  label="Opções de Partilha"
                  items={[
                    { id: '1', label: 'Copiar Ligação', onClick: () => triggerToast('info') },
                    { id: '2', label: 'Guardar nos Favoritos', onClick: () => triggerToast('success') },
                    { id: '3', label: 'Reportar Inconformidade', onClick: () => triggerToast('warning'), destructive: true },
                  ]}
                />
              </div>

              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-2">
                  Tooltips:
                </p>
                <div className="flex items-center gap-3">
                  <Tooltip content="Tooltip Superior" position="top">
                    <Button size="sm" variant="outline">Topo</Button>
                  </Tooltip>
                  <Tooltip content="Tooltip Inferior" position="bottom">
                    <Button size="sm" variant="outline">Abaixo</Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 7: CARTÕES DE OBRAS */}
      {activeDsSection === 'cards' && (
        <section className="space-y-8 animate-in fade-in duration-200">
          <div>
            <h2 className="font-title text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
              Componentes WorkCard & AuthorCard
            </h2>
            <p className="text-sm text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
              Cartões em proporção 3:4 com avisos de conteúdo, metadados limpos e layout em lista.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-3">
                Visualização em Grelha (Proporção 3:4):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <WorkCard work={MOCK_WORKS[0]} onSelect={() => triggerToast('info')} />
                <WorkCard work={MOCK_WORKS[1]} onSelect={() => triggerToast('info')} />
                <WorkCard work={MOCK_WORKS[2]} onSelect={() => triggerToast('info')} />
              </div>
            </div>

            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-3">
                Visualização em Lista:
              </p>
              <div className="space-y-4">
                <WorkCard work={MOCK_WORKS[0]} onSelect={() => triggerToast('info')} layout="list" />
                <WorkCard work={MOCK_WORKS[3]} onSelect={() => triggerToast('info')} layout="list" />
              </div>
            </div>

            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-3">
                Cartões de Autor:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AuthorCard author={MOCK_AUTHORS[0]} />
                <AuthorCard author={MOCK_AUTHORS[1]} />
                <AuthorCard author={MOCK_AUTHORS[3]} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 8: ESTADOS & FEEDBACK */}
      {activeDsSection === 'feedback' && (
        <section className="space-y-8 animate-in fade-in duration-200">
          <div>
            <h2 className="font-title text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
              Componentes de Notificação & Estados do Sistema
            </h2>
            <p className="text-sm text-[#5A6D82] dark:text-[#BFC9D6] mt-1">
              Notification (inline), Toasts, LoadingState, EmptyState e ErrorState.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] space-y-8">
            {/* Inline Notifications */}
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6]">
                Componente Notification (Inline Banners):
              </p>
              {showNotification && (
                <Notification
                  type="info"
                  title="Aviso de Atualização Editorial"
                  onDismiss={() => setShowNotification(false)}
                >
                  O Arquivo Global implementou a versão 0.1 do Design System com suporte completo aos temas Claro e Escuro.
                </Notification>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Notification type="success" title="Submissão Concluída">
                  A sua obra foi enviada para o catálogo do Arquivo.
                </Notification>
                <Notification type="warning" title="Atenção à Classificação">
                  Esta obra requer aviso de temas sensíveis.
                </Notification>
                <Notification type="error" title="Erro no Formulário">
                  Preencha o título da obra antes de prosseguir.
                </Notification>
              </div>
            </div>

            {/* Toasts Triggers */}
            <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C]">
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-3">
                Disparadores de Toasts Flutuantes:
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="subtle" onClick={() => triggerToast('success')}>
                  Toast Sucesso
                </Button>
                <Button size="sm" variant="subtle" onClick={() => triggerToast('info')}>
                  Toast Informação
                </Button>
                <Button size="sm" variant="subtle" onClick={() => triggerToast('warning')}>
                  Toast Aviso
                </Button>
                <Button size="sm" variant="subtle" onClick={() => triggerToast('error')}>
                  Toast Erro
                </Button>
              </div>
            </div>

            {/* Modal Trigger */}
            <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C]">
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-3">
                Componente Modal Reutilizável:
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDemoModalOpen(true)}
                leftIcon={<Maximize2 className="w-4 h-4" />}
              >
                Abrir Modal de Demonstração
              </Button>

              <Modal
                isOpen={isDemoModalOpen}
                onClose={() => setIsDemoModalOpen(false)}
                title="Janela Modal do Design System"
                subtitle="Exemplo de Conteúdo e Acessibilidade"
                maxWidth="md"
              >
                <div className="space-y-4 text-left">
                  <p className="text-sm text-[#5A6D82] dark:text-[#BFC9D6] leading-relaxed">
                    Este modal possui escuta de tecla ESC, travamento de rolagem no fundo e foco acessível.
                  </p>
                  <div className="p-3 rounded-lg bg-[#E7EDF5] dark:bg-[#0B1220] border border-[#D8E2ED] dark:border-[#203B5C] text-xs">
                    Design System v0.1 · Conforme WCAG AA
                  </div>
                  <div className="pt-3 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsDemoModalOpen(false)}>
                      Fechar
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setIsDemoModalOpen(false)}>
                      Entendido
                    </Button>
                  </div>
                </div>
              </Modal>
            </div>

            {/* Loading & Empty & Error States */}
            <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C] space-y-4">
              <p className="text-xs font-mono uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6]">
                LoadingState, EmptyState & ErrorState:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl border border-[#D8E2ED] dark:border-[#203B5C] bg-[#F8FAFC] dark:bg-[#0B1220]">
                  <LoadingState message="A sincronizar registos..." variant="centered" />
                </div>
                <div className="p-4 rounded-xl border border-[#D8E2ED] dark:border-[#203B5C] bg-[#F8FAFC] dark:bg-[#0B1220]">
                  <EmptyState title="Catálogo Vazio" message="Nenhuma obra encontrada para estes termos." />
                </div>
                <div className="p-4 rounded-xl border border-[#D8E2ED] dark:border-[#203B5C] bg-[#F8FAFC] dark:bg-[#0B1220]">
                  <ErrorState title="Falha de Ligação" message="Não foi possível consultar a API." />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};
