/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '../ui/Button';
import { BookOpen, Sparkles, Shield, Compass, Heart, Feather } from 'lucide-react';

export interface ManifestoViewProps {
  onNavigateToCatalog: () => void;
  onOpenPublishModal: () => void;
}

export const ManifestoView: React.FC<ManifestoViewProps> = ({
  onNavigateToCatalog,
  onOpenPublishModal,
}) => {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-4 border-b border-[#D8E2ED] dark:border-[#203B5C] pb-8">
        <span className="text-xs uppercase tracking-widest font-mono text-[#5A6D82] dark:text-[#BFC9D6]">
          Fundamentação do Projeto · Novembro 2026
        </span>
        <h1 className="font-title text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
          Manifesto do Arquivo Global
        </h1>
        <p className="text-base text-[#5A6D82] dark:text-[#BFC9D6] max-w-2xl mx-auto leading-relaxed">
          Princípios editoriais, compromisso com a criação humana e defesa da autonomia dos contadores de histórias.
        </p>
      </div>

      {/* Editorial Content Constrained to 65-75ch */}
      <div className="font-literary text-lg sm:text-xl text-[#0B1220] dark:text-[#E7EDF5] leading-relaxed space-y-8">
        
        <p className="first-letter:text-5xl first-letter:font-title first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-[#203B5C] dark:first-letter:text-[#BFC9D6]">
          O Arquivo Global nasce da urgência de devolver a dignidade e o espaço merecido à publicação independente. Num ecossistema digital saturado por algoritmos opacos, interfaces estridentes e modelos de subscrição predatórios, o AG posiciona-se como um porto seguro: um arquivo público, limpo, perene e tecnológico.
        </p>

        <div className="my-8 p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C]">
          <h2 className="font-title text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC] mb-4">
            Os Três Pilares Inegociáveis
          </h2>
          <div className="space-y-4 text-sm font-sans">
            <div>
              <p className="font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                1. Soberania Criativa & Propriedade Intelectual
              </p>
              <p className="text-[#5A6D82] dark:text-[#BFC9D6] mt-0.5">
                Nenhum criador cede os seus direitos patrimoniais ou morais ao Arquivo. As obras podem ser disponibilizadas em licenças abertas (Creative Commons) ou direitos reservados pelo próprio autor.
              </p>
            </div>

            <div>
              <p className="font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                2. Silêncio Visual & Respeito pela Leitura
              </p>
              <p className="text-[#5A6D82] dark:text-[#BFC9D6] mt-0.5">
                Não há banners piscantes, popups intrusivos ou contadores de dopamina artificial. A tipografia e os espaços em branco são pensados para permitir uma imersão profunda, seja num romance denso ou num mangá detalhado.
              </p>
            </div>

            <div>
              <p className="font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                3. Pluralidade de Expressão Sem Hierarquias
              </p>
              <p className="text-[#5A6D82] dark:text-[#BFC9D6] mt-0.5">
                Romances, contos breves, poesia visual, bandas desenhadas europeias e mangás orientais convivem no mesmo arquivo com igual dignidade de catalogação e qualidade de visualização.
              </p>
            </div>
          </div>
        </div>

        <p>
          Acreditamos que a tecnologia deve servir de suporte invisível à arte, e não de protagonista estridente. Por isso, as escolhas de cores (do Azul Abissal à Prata) e de tipografia (Cormorant Garamond e Plus Jakarta Sans) foram rigorosamente calibradas para proporcionar uma experiência que resista ao teste do tempo.
        </p>
      </div>

      {/* Signature & Actions */}
      <div className="pt-8 border-t border-[#D8E2ED] dark:border-[#203B5C] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-title text-lg font-bold text-[#0B1220] dark:text-[#F8FAFC]">
            Conselho Curatorial do Arquivo Global
          </p>
          <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
            Documento de Fundação Editorial · Lisboa / Porto / Internacional
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToCatalog}
          >
            Explorar Catálogo
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onOpenPublishModal}
            leftIcon={<Feather className="w-3.5 h-3.5" />}
          >
            Submeter Obra
          </Button>
        </div>
      </div>

    </article>
  );
};
