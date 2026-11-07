/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Author } from '../../types';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { UserCheck, UserPlus, MapPin, BookOpen } from 'lucide-react';

export interface AuthorCardProps {
  author: Author;
  onSelectAuthor?: (author: Author) => void;
}

export const AuthorCard: React.FC<AuthorCardProps> = ({
  author,
  onSelectAuthor,
}) => {
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(author.isFollowing || false);

  const toggleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowing(!isFollowing);
    showToast(
      isFollowing ? 'Deixou de seguir' : 'A seguir criador',
      isFollowing
        ? `Deixou de acompanhar ${author.name}.`
        : `Agora está a acompanhar as publicações de ${author.name}.`,
      'info'
    );
  };

  return (
    <article
      onClick={() => onSelectAuthor?.(author)}
      className="p-5 bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] rounded-xl flex flex-col justify-between hover:border-[#203B5C] dark:hover:border-[#BFC9D6]/60 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#E7EDF5] dark:bg-[#0B1220] border border-[#D8E2ED] dark:border-[#203B5C] shrink-0">
              <img
                src={author.avatarUrl}
                alt={author.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="font-title text-base font-bold text-[#0B1220] dark:text-[#F8FAFC] leading-tight">
                {author.name}
              </h4>
              <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6]">{author.handle}</p>
            </div>
          </div>

          <Button
            size="sm"
            variant={isFollowing ? 'secondary' : 'primary'}
            onClick={toggleFollow}
            leftIcon={isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          >
            {isFollowing ? 'A Seguir' : 'Seguir'}
          </Button>
        </div>

        <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] mt-3 line-clamp-2 leading-relaxed">
          {author.bio}
        </p>

        <div className="mt-3 flex items-center gap-2 text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
          <span className="text-[#203B5C] dark:text-[#E7EDF5] font-medium">{author.role}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 opacity-60" />
            {author.location}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#D8E2ED] dark:border-[#203B5C]/60 flex items-center justify-between text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 opacity-70" />
          <span>{author.worksCount} obras publicadas</span>
        </div>

        <span className="tabular-nums font-mono text-[#0B1220] dark:text-[#F8FAFC]">
          {author.followersCount.toLocaleString('pt-PT')} leitores
        </span>
      </div>
    </article>
  );
};
