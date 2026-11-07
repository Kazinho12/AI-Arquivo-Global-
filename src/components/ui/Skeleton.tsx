/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const WorkCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] rounded-xl overflow-hidden animate-pulse">
      {/* 3:4 aspect ratio cover */}
      <div className="aspect-[3/4] w-full bg-[#E7EDF5] dark:bg-[#1B2E49]" />
      
      {/* Content */}
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 w-16 bg-[#E7EDF5] dark:bg-[#203B5C] rounded" />
          <div className="h-3 w-8 bg-[#E7EDF5] dark:bg-[#203B5C] rounded" />
        </div>
        <div className="h-5 w-4/5 bg-[#E7EDF5] dark:bg-[#203B5C] rounded" />
        <div className="h-3.5 w-1/2 bg-[#E7EDF5] dark:bg-[#203B5C] rounded" />
        <div className="mt-2 pt-2 border-t border-[#D8E2ED] dark:border-[#203B5C]/60 flex items-center justify-between">
          <div className="h-3 w-20 bg-[#E7EDF5] dark:bg-[#203B5C] rounded" />
          <div className="h-3 w-12 bg-[#E7EDF5] dark:bg-[#203B5C] rounded" />
        </div>
      </div>
    </div>
  );
};

export const AuthorCardSkeleton: React.FC = () => {
  return (
    <div className="p-5 bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] rounded-xl animate-pulse flex items-start gap-4">
      <div className="w-14 h-14 rounded-full bg-[#E7EDF5] dark:bg-[#1B2E49] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-[#E7EDF5] dark:bg-[#203B5C] rounded" />
        <div className="h-3 w-24 bg-[#E7EDF5] dark:bg-[#203B5C] rounded" />
        <div className="h-3 w-full bg-[#E7EDF5] dark:bg-[#203B5C] rounded" />
        <div className="h-3 w-4/5 bg-[#E7EDF5] dark:bg-[#203B5C] rounded" />
      </div>
    </div>
  );
};
