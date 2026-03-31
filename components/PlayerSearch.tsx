'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, User, Loader2 } from 'lucide-react';
import type { PlayerInfo } from '@/lib/mcp';

interface PlayerSearchProps {
  label: string;
  value: PlayerInfo | null;
  onChange: (player: PlayerInfo | null) => void;
  disabled?: boolean;
}

export default function PlayerSearch({ label, value, onChange, disabled }: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 4) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    setError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: query }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResults(data.players || []);
        setShowDropdown(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lookup failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (player: PlayerInfo) => {
    onChange(player);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />}
        {value && !loading && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value ? `${value.name} (${value.team})` : query}
          onChange={(e) => {
            if (!value) setQuery(e.target.value);
          }}
          onFocus={() => {
            if (!value && results.length > 0) setShowDropdown(true);
          }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          disabled={disabled || !!value}
          placeholder={`Search ${label.toLowerCase()} (4+ chars)...`}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-10 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
        />
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-auto">
          {results.map((player) => (
            <button
              key={player.id}
              onMouseDown={() => handleSelect(player)}
              className="w-full px-4 py-3 text-left hover:bg-slate-700 flex items-center gap-3 border-b border-slate-700 last:border-0"
            >
              <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-slate-100 font-medium truncate">{player.name}</p>
                <p className="text-sm text-slate-400">{player.team} · {player.position}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && query.length >= 4 && results.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl px-4 py-3">
          <p className="text-slate-400 text-sm">No players found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
