/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { AgeRating, WorkFormat } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Feather, Upload, Shield, CheckCircle2 } from 'lucide-react';

export interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [format, setFormat] = useState<WorkFormat>('romance');
  const [ageRating, setAgeRating] = useState<AgeRating>('L');
  const [synopsis, setSynopsis] = useState('');
  const [license, setLicense] = useState('CC BY-NC 4.0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !authorName.trim()) {
      showToast('Campos obrigatórios', 'Por favor preencha o título da obra e o nome do autor.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      showToast(
        'Submissão registada (Demonstração)',
        `A obra "${title}" foi registada no fluxo de verificação do Arquivo Global.`,
        'success'
      );
    }, 1000);
  };

  const handleReset = () => {
    setTitle('');
    setAuthorName('');
    setSynopsis('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={submitted ? 'Submissão Concluída' : 'Submeter Obra ao Arquivo Global'}
      subtitle="Publicação Independente & Autonomia Criativa"
      maxWidth="xl"
    >
      {submitted ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="font-title text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
            Obra Recebida para Demonstração
          </h3>

          <p className="text-sm text-[#5A6D82] dark:text-[#BFC9D6] max-w-md mx-auto leading-relaxed">
            Nesta etapa de fundação visual, o fluxo de submissão valida a integridade de dados e conformidade tipográfica. Na fase seguinte com Supabase, esta entrada será persistida na base de dados relacional.
          </p>

          <div className="p-4 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#D8E2ED] dark:border-[#203B5C] text-left text-xs space-y-1">
            <p><span className="text-[#5A6D82] dark:text-[#BFC9D6]">Título:</span> <strong className="text-[#0B1220] dark:text-[#F8FAFC]">{title}</strong></p>
            <p><span className="text-[#5A6D82] dark:text-[#BFC9D6]">Autor:</span> <strong className="text-[#0B1220] dark:text-[#F8FAFC]">{authorName}</strong></p>
            <p><span className="text-[#5A6D82] dark:text-[#BFC9D6]">Formato:</span> <strong className="text-[#0B1220] dark:text-[#F8FAFC]">{format.toUpperCase()}</strong></p>
            <p><span className="text-[#5A6D82] dark:text-[#BFC9D6]">Licença:</span> <strong className="text-[#0B1220] dark:text-[#F8FAFC]">{license}</strong></p>
          </div>

          <div className="pt-4">
            <Button variant="primary" size="md" onClick={handleReset}>
              Concluir e Voltar
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label="Título da Obra *"
            placeholder="Ex: Cartas do Fim do Mundo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome do Autor / Pseudónimo *"
              placeholder="Ex: Mário de Sá-Carneiro"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
            />

            <Select
              label="Formato Editorial"
              options={[
                { value: 'romance', label: 'Romance' },
                { value: 'conto', label: 'Conto' },
                { value: 'poesia', label: 'Poesia' },
                { value: 'hq', label: 'Banda Desenhada / HQ' },
                { value: 'manga', label: 'Mangá' },
              ]}
              value={format}
              onChange={(e) => setFormat(e.target.value as WorkFormat)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Classificação Indicativa"
              options={[
                { value: 'L', label: 'Livre (Todos os Públicos)' },
                { value: '12', label: '12+ (Não recomendado para menores de 12)' },
                { value: '14', label: '14+ (Não recomendado para menores de 14)' },
                { value: '16', label: '16+ (Não recomendado para menores de 16)' },
                { value: '18', label: '18+ (Adulto)' },
              ]}
              value={ageRating}
              onChange={(e) => setAgeRating(e.target.value as AgeRating)}
            />

            <Select
              label="Licença de Publicação"
              options={[
                { value: 'CC BY-NC 4.0', label: 'Creative Commons Não-Comercial (CC BY-NC 4.0)' },
                { value: 'CC BY 4.0', label: 'Creative Commons Atribuição (CC BY 4.0)' },
                { value: 'CC0', label: 'Domínio Público (CC0)' },
                { value: 'Copyright', label: 'Todos os Direitos Reservados ao Autor' },
              ]}
              value={license}
              onChange={(e) => setLicense(e.target.value)}
            />
          </div>

          <Textarea
            label="Sinopse ou Declaração do Autor"
            placeholder="Apresente brevemente o argumento da obra, premissa ou motivação..."
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            maxLength={400}
            currentLength={synopsis.length}
          />

          <div className="pt-4 border-t border-[#D8E2ED] dark:border-[#203B5C] flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Feather className="w-3.5 h-3.5" />}
            >
              Submeter Registo
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
