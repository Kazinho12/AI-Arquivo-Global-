import {
  useState,
  useRef,
  useEffect,
  useId,
  useMemo,
  type KeyboardEvent,
  type FocusEvent,
} from "react";
import { Search, ChevronDown, Check, X, Globe, Sparkles } from "lucide-react";
import {
  LANGUAGE_CATALOG,
  searchLanguages,
  getPopularLanguages,
  findLanguage,
  isRtlLanguage,
  type LanguageDefinition,
} from "../data/languages";

export interface LanguageComboboxProps {
  value: string;
  onChange: (value: string, language?: LanguageDefinition) => void;
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  allowCustom?: boolean;
}

const REGION_FILTERS = [
  "Todos",
  "África",
  "Américas",
  "Ásia",
  "Europa",
  "Oceânia",
  "Global/Especial",
] as const;

type RegionFilter = (typeof REGION_FILTERS)[number];

export function LanguageCombobox({
  value,
  onChange,
  id: customId,
  name,
  label = "Idioma da Obra",
  placeholder = "Pesquisar por nome, código ou língua nativa…",
  helperText,
  disabled = false,
  required = false,
  className = "",
  allowCustom = false,
}: LanguageComboboxProps) {
  const generatedId = useId();
  const comboboxId = customId || `lang-combobox-${generatedId}`;
  const listboxId = `lang-listbox-${generatedId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>("Todos");

  // Idioma selecionado atualmente
  const selectedLang = useMemo(() => findLanguage(value), [value]);

  // Idiomas populares
  const popularLanguages = useMemo(() => getPopularLanguages(), []);

  // Lista filtrada com base na pesquisa e região
  const filteredLanguages = useMemo(() => {
    let results: LanguageDefinition[];
    if (!query.trim()) {
      results = LANGUAGE_CATALOG;
    } else {
      results = searchLanguages(query, 100);
    }

    if (selectedRegion === "Todos") {
      return results;
    }

    if (selectedRegion === "Global/Especial") {
      return results.filter(
        (l) => l.region === "Global" || l.region === "Especial",
      );
    }

    return results.filter((l) => l.region === selectedRegion);
  }, [query, selectedRegion]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSelect = (lang: LanguageDefinition) => {
    onChange(lang.name, lang);
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", undefined);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredLanguages.length - 1 ? prev + 1 : 0,
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredLanguages.length - 1,
        );
        break;

      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredLanguages.length) {
          handleSelect(filteredLanguages[activeIndex]);
        } else if (allowCustom && query.trim()) {
          onChange(query.trim(), undefined);
          setIsOpen(false);
          setQuery("");
        } else if (filteredLanguages.length > 0) {
          handleSelect(filteredLanguages[0]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;

      case "Tab":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const activeOptionId =
    activeIndex >= 0 && activeIndex < filteredLanguages.length
      ? `${listboxId}-opt-${activeIndex}`
      : undefined;

  const isCurrentRtl = isRtlLanguage(value);

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left font-sans ${className}`}
    >
      {/* Rótulo Acessível */}
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={comboboxId}
            className="block text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {isCurrentRtl && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Escrita RTL ⇄
            </span>
          )}
        </div>
      )}

      {/* Caixa de Entrada Interativa */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Globe size={16} />
        </div>

        <input
          ref={inputRef}
          id={comboboxId}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          disabled={disabled}
          required={required}
          value={isOpen ? query : value || ""}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setQuery("");
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={value ? value : placeholder}
          className={`w-full pl-9 pr-16 py-2.5 text-sm rounded-lg border transition-all outline-none 
            ${
              isOpen
                ? "border-slate-800 dark:border-slate-300 ring-2 ring-slate-800/10 dark:ring-slate-300/10"
                : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
            }
            ${
              disabled
                ? "bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed"
                : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            }`}
        />

        {/* Botões de Ação na Direita (Limpar e Toggle) */}
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              aria-label="Limpar idioma selecionado"
              onClick={handleClear}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={15} />
            </button>
          )}

          <button
            type="button"
            aria-label={isOpen ? "Fechar seletor" : "Abrir seletor"}
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen((prev) => !prev);
                if (!isOpen) {
                  inputRef.current?.focus();
                }
              }
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Texto de Apoio / Dica */}
      {helperText && !isOpen && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}

      {/* Menu Dropdown de Seleção */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 duration-150">
          {/* Barra de Filtro Rápido por Região Continental */}
          <div className="px-2 pt-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
              {REGION_FILTERS.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => {
                    setSelectedRegion(region);
                    setActiveIndex(0);
                  }}
                  className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    selectedRegion === region
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Atalhos Rápidos (Idiomas Populares) quando a busca está vazia */}
          {!query.trim() && selectedRegion === "Todos" && (
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                <Sparkles size={13} className="text-amber-500" />
                <span>Mais Frequentes</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularLanguages.slice(0, 10).map((lang) => {
                  const isCurrent =
                    value.toLowerCase() === lang.name.toLowerCase() ||
                    value.toLowerCase() === lang.code.toLowerCase();
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelect(lang)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                        isCurrent
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent"
                          : "bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                      }`}
                    >
                      <span>{lang.name}</span>
                      <span className="text-[10px] opacity-70 font-mono uppercase">
                        {lang.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de Opções Listbox */}
          <ul
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-label="Catálogo de Idiomas"
            className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-transparent focus:outline-none"
          >
            {filteredLanguages.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                <p>Nenhum idioma encontrado para &ldquo;{query}&rdquo;.</p>
                {allowCustom && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(query.trim(), undefined);
                      setIsOpen(false);
                    }}
                    className="mt-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Usar &ldquo;{query.trim()}&rdquo; como idioma personalizado
                  </button>
                )}
              </li>
            ) : (
              filteredLanguages.map((lang, index) => {
                const isSelected =
                  value.toLowerCase() === lang.name.toLowerCase() ||
                  value.toLowerCase() === lang.code.toLowerCase();
                const isFocused = index === activeIndex;

                return (
                  <li
                    key={lang.code}
                    id={`${listboxId}-opt-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(lang)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                      isFocused
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    } ${isSelected ? "font-semibold text-slate-950 dark:text-white" : ""}`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{lang.name}</span>
                        {lang.direction === "rtl" && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            RTL
                          </span>
                        )}
                        {lang.isPopular && (
                          <span className="text-[10px] font-medium px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Frequente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                        {lang.nativeName && lang.nativeName !== lang.name && (
                          <span className="truncate italic">
                            {lang.nativeName}
                          </span>
                        )}
                        <span>·</span>
                        <span>{lang.region}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {lang.code}
                      </span>
                      {isSelected && (
                        <Check
                          size={16}
                          className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                        />
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {/* Rodapé Informativo */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>
              {filteredLanguages.length} idioma
              {filteredLanguages.length === 1 ? "" : "s"} disponível
              {filteredLanguages.length === 1 ? "" : "is"}
            </span>
            <span className="font-mono text-[10px]">ISO 639 / BCP-47</span>
          </div>
        </div>
      )}
    </div>
  );
}
