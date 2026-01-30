import { useEffect, useMemo, useRef, useState } from "react";

type Option = { id: string; label: string };

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  allLabel = "All providers",
  className = "w-64"
}: {
  options: Option[];
  value: string | null;                // current selected id (or null for "All")
  onChange: (val: string | null) => void;
  placeholder?: string;
  allLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const allOption: Option = { id: "__ALL__", label: allLabel };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = !q
      ? options
      : options.filter((o) => o.label.toLowerCase().includes(q));
    return [allOption, ...base];
  }, [options, query]);

  const selectedLabel =
    value === null
      ? allLabel
      : options.find((o) => o.id === value)?.label ?? placeholder;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
      setHighlight(0);
    }
  }, [open]);

  // Keep highlighted item in view
  useEffect(() => {
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const commit = (opt: Option) => {
    if (opt.id === "__ALL__") onChange(null);
    else onChange(opt.id);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight(0);
          }
        }}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg className="ml-2 h-4 w-4 opacity-60" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg"
          role="dialog"
          aria-label="Search options"
          style={{background:"white"}}
        >
          <div className="p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search providers…"
              className="w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlight((h) => Math.min(h + 1, filtered.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlight((h) => Math.max(h - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  commit(filtered[highlight]);
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
            />
          </div>

          <ul
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-auto py-1 text-sm"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-gray-500">No results</li>
            )}
            {filtered.map((opt, i) => {
              const isSelected =
                (opt.id === "__ALL__" && value === null) || opt.id === value;
              const isActive = i === highlight;
              return (
                <li
                  key={opt.id + i}
                  role="option"
                  aria-selected={isSelected}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 ${
                    isActive ? "bg-gray-100" : ""
                  }`}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                  onClick={() => commit(opt)}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 9.435a1 1 0 111.414-1.414l3.101 3.101 6.657-6.657a1 1 0 011.242-.172z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
