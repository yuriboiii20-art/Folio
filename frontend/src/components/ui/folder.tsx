import React from 'react';
import { Archive, Share2, Star, Trash2 } from 'lucide-react';

export interface FolderProps {
  title?: string;
  code?: string;
  description?: string;
  fileCount?: number;
  isStarred?: boolean;
  isArchived?: boolean;
  onStarToggle?: (e: React.MouseEvent) => void;
  onShare?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  /** Renders the multi-select checkbox used by the bulk action bar. */
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  onClick?: () => void;
  className?: string;
}

export const FolderCard: React.FC<FolderProps> = ({
  title,
  code,
  description,
  fileCount,
  isStarred = false,
  isArchived = false,
  onStarToggle,
  onShare,
  onDelete,
  selectable = false,
  selected = false,
  onSelectChange,
  onClick,
  className = ""
}) => {
  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // The checkbox only needs the card click suppressed — calling preventDefault
  // here would cancel the checkbox activation and swallow its change event.
  const stopPropagationOnly = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center p-4 rounded-xl border bg-white transition-all cursor-pointer shadow-2xs hover:shadow-md ${
        selected
          ? 'border-slate-900 ring-2 ring-slate-900/20 bg-slate-50'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
      } ${isArchived ? 'opacity-70' : ''} ${className}`}
    >
      {/* Multi-select checkbox */}
      {selectable && (
        <label
          onClick={stopPropagationOnly}
          className={`absolute top-2 left-2 z-20 flex items-center justify-center transition-opacity ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
          }`}
          title={selected ? 'Deselect folder' : 'Select folder'}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelectChange?.(e.target.checked)}
            className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
            aria-label={`Select ${title || 'folder'}`}
          />
        </label>
      )}

      {/* Card actions */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
        {onStarToggle && (
          <button
            onClick={(e) => { stop(e); onStarToggle(e); }}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isStarred
                ? 'border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100 shadow-xs'
                : 'border-slate-200 bg-white/90 text-slate-400 hover:text-amber-500 hover:bg-amber-50 opacity-0 group-hover:opacity-100'
            }`}
            title={isStarred ? 'Starred folder (click to unstar)' : 'Star this folder'}
            aria-pressed={isStarred}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}`} />
          </button>
        )}

        {onShare && (
          <button
            onClick={(e) => { stop(e); onShare(e); }}
            className="p-1.5 rounded-lg border border-slate-200 bg-white/90 text-slate-400 hover:text-slate-900 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            title="Share this folder"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        )}

        {onDelete && (
          <button
            onClick={(e) => { stop(e); onDelete(e); }}
            className="p-1.5 rounded-lg border border-slate-200 bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            title="Delete this folder"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Archived marker */}
      {isArchived && (
        <span className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-wider">
          <Archive className="w-2.5 h-2.5" />
          <span>Archived</span>
        </span>
      )}

      {/* Interactive 3D Folder Graphic */}
      <div className="file relative w-full max-w-36 h-24 cursor-pointer origin-bottom [perspective:1000px] z-10 my-2">
        <div className="work-5 bg-amber-300 w-full h-full origin-top rounded-xl rounded-tl-none group-hover:shadow-[0_10px_20px_rgba(0,0,0,.08)] transition-all ease duration-300 relative after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-12 after:h-3 after:bg-amber-300 after:rounded-t-xl before:absolute before:content-[''] before:-top-[11px] before:left-[45px] before:w-3 before:h-3 before:bg-amber-300 before:[clip-path:polygon(0_35%,0%_100%,50%_100%);]" />
        <div className="work-4 absolute inset-1 bg-amber-50/90 rounded-xl transition-all ease duration-300 origin-bottom select-none group-hover:[transform:rotateX(-20deg)]" />
        <div className="work-3 absolute inset-1 bg-sky-50 rounded-xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-30deg)]" />
        <div className="work-2 absolute inset-1 bg-white rounded-xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-38deg)]" />
        <div className="work-1 absolute bottom-0 bg-gradient-to-t from-amber-200 to-amber-100 w-full h-[92px] rounded-xl rounded-tr-none after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-[86px] after:h-[10px] after:bg-amber-100 after:rounded-t-xl before:absolute before:content-[''] before:-top-[6px] before:right-[84px] before:size-2.5 before:bg-amber-100 before:[clip-path:polygon(100%_14%,50%_100%,100%_100%);] transition-all ease duration-300 origin-bottom flex items-end justify-center pb-2 group-hover:shadow-[inset_0_10px_20px_#fef3c7,_inset_0_-10px_20px_#fde68a] group-hover:[transform:rotateX(-46deg)_translateY(1px)]">
          {code && (
            <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest bg-white/80 border border-amber-200/80 px-2 py-0.5 rounded shadow-2xs backdrop-blur-xs">
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
