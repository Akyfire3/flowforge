'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAppDataContext } from '@/lib/context';
import { formatShortTime } from '@/lib/utils';

export default function TagsPage() {
  const { tags, addTag, deleteTag, isLoading } = useAppDataContext();
  const [newTagName, setNewTagName] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    addTag(newTagName.trim());
    setNewTagName('');
  };

  if (isLoading) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tags</h1>

      <form onSubmit={handleAddTag} className="flex items-center gap-4 bg-[#1a1a1a] p-4 rounded-xl border border-[#262626]">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag (e.g. #focus)"
          className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder-[#a3a3a3]"
        />
        
        <button
          type="submit"
          disabled={!newTagName.trim()}
          className="bg-[#262626] hover:bg-[#333] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-[#262626] hover:bg-[#262626]/30 transition-colors"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[#60a5fa] font-medium bg-blue-500/10 px-2 py-0.5 rounded text-sm w-fit">
                {tag.name}
              </span>
              <span className="text-xs text-[#a3a3a3]">
                {tag.sessions} sessions • {formatShortTime(tag.totalTime)}
              </span>
            </div>
            
            <button
              onClick={() => deleteTag(tag.id)}
              className="text-[#a3a3a3] hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
