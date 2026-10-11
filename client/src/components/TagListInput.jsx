import { useState } from "react";

export default function TagListInput({
  label,
  id,
  items = [],
  onChange,
  placeholder = "Enter item...",
  helperText,
  badgeType = "default"
}) {
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Prevent case-insensitive duplicates
    const exists = items.some((item) => item.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setDuplicateWarning(true);
      setTimeout(() => setDuplicateWarning(false), 2500);
      return;
    }

    onChange([...items, trimmed]);
    setInputValue("");
    setDuplicateWarning(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index) => {
    onChange(items.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  };

  const saveEdit = (index) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      handleRemove(index);
      return;
    }
    const next = [...items];
    next[index] = trimmed;
    onChange(next);
    setEditingIndex(null);
  };

  return (
    <div className="field tag-list-input-group">
      {label && <label htmlFor={id}>{label}</label>}

      <div className="tag-input-row">
        <input
          id={id}
          type="text"
          value={inputValue}
          placeholder={placeholder}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (duplicateWarning) setDuplicateWarning(false);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="btn btn-add"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
        >
          Add +
        </button>
      </div>

      {duplicateWarning && (
        <small className="field-error">This item has already been added.</small>
      )}

      {helperText && <small className="tag-helper">{helperText}</small>}

      {items.length > 0 && (
        <div className="tag-list-container">
          <span className="tag-list-caption">Added ({items.length}):</span>
          <div className="chips tag-chips">
            {items.map((item, index) => {
              const isEditing = editingIndex === index;
              return (
                <div key={`${item}-${index}`} className={`tag-item ${badgeType}`}>
                  {isEditing ? (
                    <span className="tag-edit-box">
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(index);
                          if (e.key === "Escape") setEditingIndex(null);
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-save"
                        onClick={() => saveEdit(index)}
                      >
                        Save
                      </button>
                    </span>
                  ) : (
                    <>
                      <span
                        className="tag-text"
                        onClick={() => startEdit(index)}
                        title="Click to edit"
                      >
                        {item}
                      </span>
                      <button
                        type="button"
                        className="tag-remove-btn"
                        onClick={() => handleRemove(index)}
                        title={`Remove ${item}`}
                        aria-label={`Remove ${item}`}
                      >x</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
