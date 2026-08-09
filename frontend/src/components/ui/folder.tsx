import React from 'react';

export interface FolderProps {
  title?: string;
  code?: string;
  description?: string;
  fileCount?: number;
  isStarred?: boolean;
  onStarToggle?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  className?: string;
}

export const FolderCard: React.FC<FolderProps> = ({
  title,
  code,
  description,
  fileCount,
  isStarred,
  onStarToggle,
  onClick,
  className = ""
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer shadow-2xs hover:shadow-md ${className}`}
    >
      {/* Interactive 3D Folder Graphic */}
      <div className="file relative w-36 h-24 cursor-pointer origin-bottom [perspective:1000px] z-10 my-2">
        <div className="work-5 bg-amber-600 w-full h-full origin-top rounded-xl rounded-tl-none group-hover:shadow-[0_10px_20px_rgba(0,0,0,.15)] transition-all ease duration-300 relative after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-12 after:h-3 after:bg-amber-600 after:rounded-t-xl before:absolute before:content-[''] before:-top-[11px] before:left-[45px] before:w-3 before:h-3 before:bg-amber-600 before:[clip-path:polygon(0_35%,0%_100%,50%_100%);]" />
        <div className="work-4 absolute inset-1 bg-zinc-400 rounded-xl transition-all ease duration-300 origin-bottom select-none group-hover:[transform:rotateX(-20deg)]" />
        <div className="work-3 absolute inset-1 bg-zinc-300 rounded-xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-30deg)]" />
        <div className="work-2 absolute inset-1 bg-zinc-200 rounded-xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-38deg)]" />
        <div className="work-1 absolute bottom-0 bg-gradient-to-t from-amber-500 to-amber-400 w-full h-[92px] rounded-xl rounded-tr-none after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-[86px] after:h-[10px] after:bg-amber-400 after:rounded-t-xl before:absolute before:content-[''] before:-top-[6px] before:right-[84px] before:size-2.5 before:bg-amber-400 before:[clip-path:polygon(100%_14%,50%_100%,100%_100%);] transition-all ease duration-300 origin-bottom flex items-end justify-center pb-2 group-hover:shadow-[inset_0_10px_20px_#fbbf24,_inset_0_-10px_20px_#d97706] group-hover:[transform:rotateX(-46deg)_translateY(1px)]">
          {code && (
            <span className="text-[10px] font-black text-amber-950/80 uppercase tracking-widest bg-amber-200/60 px-1.5 py-0.5 rounded shadow-xs backdrop-blur-xs">
              {code}
            </span>
          )}
        </div>
      </div>

      {/* Subject Information */}
      {title && (
        <div className="w-full text-center mt-2 space-y-0.5">
          <h3 className="text-xs font-black text-slate-900 truncate group-hover:text-amber-700 transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">
              {description}
            </p>
          )}
          {typeof fileCount === 'number' && (
            <span className="inline-block text-[10px] font-bold text-slate-400 mt-1">
              {fileCount} File{fileCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderCard;
