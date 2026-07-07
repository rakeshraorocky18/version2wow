import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { PRESET_HOBBIES } from '../../../types/profile';

interface HobbiesStepProps {
  hobbies: string[];
  errors: Record<string, string>;
  onChange: (hobbies: string[]) => void;
}

export default function HobbiesStep({ hobbies, errors, onChange }: HobbiesStepProps) {
  const [customInput, setCustomInput] = useState('');

  const toggle = (hobby: string) => {
    onChange(
      hobbies.includes(hobby) ? hobbies.filter((h) => h !== hobby) : [...hobbies, hobby],
    );
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed || hobbies.includes(trimmed)) return;
    onChange([...hobbies, trimmed]);
    setCustomInput('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900">Hobbies & Interests</h2>
        <p className="text-sm text-gray-500 mt-1">Select what you enjoy doing</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_HOBBIES.map((hobby) => (
          <button
            key={hobby}
            type="button"
            onClick={() => toggle(hobby)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              hobbies.includes(hobby)
                ? 'bg-primary-600 text-white shadow-sm scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {hobby}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Add Custom Hobby</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
            className="input-field flex-1"
            placeholder="Type a hobby and press Add"
          />
          <button type="button" onClick={addCustom} className="btn-secondary flex items-center gap-1 shrink-0">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {hobbies.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Selected ({hobbies.length})</p>
          <div className="flex flex-wrap gap-2">
            {hobbies.map((hobby) => (
              <span
                key={hobby}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm"
              >
                {hobby}
                <button type="button" onClick={() => toggle(hobby)} className="hover:text-primary-900">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {errors.hobbies && <p className="text-xs text-red-500">{errors.hobbies}</p>}
    </div>
  );
}
