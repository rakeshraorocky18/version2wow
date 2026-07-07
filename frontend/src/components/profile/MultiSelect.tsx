import { useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
};

export default function MultiSelect({ label, options, value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState('');

  const filtered = options.filter(
    (o) => o.toLowerCase().includes(query.toLowerCase()) && !value.includes(o),
  );

  const add = (item: string) => {
    if (!value.includes(item)) onChange([...value, item]);
    setQuery('');
  };

  const remove = (item: string) => onChange(value.filter((v) => v !== item));

  return (
    <div>
      <label className="profile-field-label">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-[#FFF0F5] px-3 py-1 text-xs font-medium text-[#8B3D62]"
          >
            {item}
            <button type="button" onClick={() => remove(item)} className="text-[#B66A8A] hover:text-[#8B3D62]">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || 'Search and select...'}
        className="profile-input"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && filtered[0]) {
            e.preventDefault();
            add(filtered[0]);
          }
        }}
      />
      {query && filtered.length > 0 && (
        <div className="mt-1 max-h-36 overflow-y-auto rounded-xl border border-[#F2DFE8] bg-white shadow-sm">
          {filtered.slice(0, 8).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => add(item)}
              className="block w-full px-4 py-2 text-left text-sm text-[#5D2B44] hover:bg-[#FFF5F8]"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
