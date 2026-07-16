import { Plus, Trash2 } from 'lucide-react';
import type { FamilyAssetsState, PropertyTypeId } from '../../../types/addCustomer';
import { createEmptyPropertyEntry, PROPERTY_TYPE_CONFIG } from '../../../types/addCustomer';
import { OWNERSHIP_OPTIONS } from '../../../lib/agent/formOptions';
import { FormField, FormGrid, FormInput, FormSelect } from './WizardUI';

interface FamilyAssetsProps {
  value: FamilyAssetsState;
  onChange: (value: FamilyAssetsState) => void;
  errors?: Record<string, string>;
}

export default function FamilyAssets({ value, onChange, errors }: FamilyAssetsProps) {
  const selectedTypes = value.selectedTypes || [];

  const addType = (typeId: PropertyTypeId) => {
    if (!typeId || selectedTypes.includes(typeId)) return;
    const nextEntries = { ...value.entries };
    nextEntries[typeId] = [createEmptyPropertyEntry()];
    onChange({ selectedTypes: [...selectedTypes, typeId], entries: nextEntries });
  };

  const removeType = (typeId: PropertyTypeId) => {
    const nextEntries = { ...value.entries };
    delete nextEntries[typeId];
    onChange({
      selectedTypes: selectedTypes.filter((t) => t !== typeId),
      entries: nextEntries,
    });
  };

  const updateEntry = (
    typeId: PropertyTypeId,
    entryId: string,
    field: string,
    fieldValue: string,
  ) => {
    const entries = (value.entries[typeId] || []).map((entry) =>
      entry.id === entryId ? { ...entry, [field]: fieldValue } : entry,
    );
    onChange({ ...value, entries: { ...value.entries, [typeId]: entries } });
  };

  const addEntry = (typeId: PropertyTypeId) => {
    const entries = [...(value.entries[typeId] || []), createEmptyPropertyEntry()];
    onChange({ ...value, entries: { ...value.entries, [typeId]: entries } });
  };

  const removeEntry = (typeId: PropertyTypeId, entryId: string) => {
    const entries = (value.entries[typeId] || []).filter((e) => e.id !== entryId);
    onChange({ ...value, entries: { ...value.entries, [typeId]: entries } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-wow-text mb-1">Family Properties</h3>
        <p className="text-xs text-wow-muted mb-4">
          Select property types owned by the family. Add details for each property.
        </p>
        {errors?.familyAssets && (
          <p className="text-xs text-red-600 mb-3">{errors.familyAssets}</p>
        )}

        <div>
          <select
            className="input-field"
            value=""
            onChange={(e) => addType(e.target.value as PropertyTypeId)}
          >
            <option value="">Select house or plot type to add</option>
            {PROPERTY_TYPE_CONFIG.filter((type) => !selectedTypes.includes(type.id)).map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTypes.map((typeId) => {
        const config = PROPERTY_TYPE_CONFIG.find((t) => t.id === typeId);
        if (!config) return null;
        const entries = value.entries[typeId] || [];

        return (
          <div
            key={typeId}
            className="rounded-[20px] border border-gray-100 p-5 bg-wow-bg/30 transition-all duration-200"
          >
            <h4 className="font-medium text-wow-text mb-4">{config.label}</h4>
            <button
              type="button"
              className="mb-4 text-xs text-red-500 hover:underline"
              onClick={() => removeType(typeId)}
            >
              Remove {config.label}
            </button>

            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-wow-text">
                      {config.label} #{index + 1}
                    </p>
                    {entries.length > 1 && (
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                        onClick={() => removeEntry(typeId, entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <FormGrid>
                    {config.fields.map((field) => (
                      <FormField
                        key={field.key}
                        label={field.label}
                        className={field.fullWidth ? 'md:col-span-2' : ''}
                      >
                        {field.type === 'select' ? (
                          <FormSelect
                            value={(entry[field.key] as string) || ''}
                            onChange={(v) => updateEntry(typeId, entry.id, field.key, v)}
                            options={OWNERSHIP_OPTIONS}
                          />
                        ) : (
                          <FormInput
                            value={(entry[field.key] as string) || ''}
                            onChange={(v) => updateEntry(typeId, entry.id, field.key, v)}
                            type={field.type === 'number' ? 'number' : 'text'}
                            placeholder={field.placeholder}
                          />
                        )}
                      </FormField>
                    ))}
                  </FormGrid>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-4 btn-secondary !py-2 !px-4 text-sm inline-flex items-center gap-2"
              onClick={() => addEntry(typeId)}
            >
              <Plus className="w-4 h-4" /> Add Another {config.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
