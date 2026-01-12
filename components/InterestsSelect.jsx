"use client";

const ALL_INTERESTS = [
  { value: "soccer", label: "⚽️ Soccer" },
  { value: "basketball", label: "🏀 Basketball" },
  { value: "baseball", label: "⚾️ Baseball" },
  { value: "cricket", label: "🏏 Cricket" },
  { value: "swimming", label: "🏊‍♂️ Swimming" },
  { value: "tennis", label: "🎾 Tennis" },
  { value: "volleyball", label: "🏐 Volleyball" },
  { value: "running", label: "🏃‍♂️ Running / Track" },
  { value: "esports", label: "🎮 Esports / Gaming" },
  { value: "other", label: "✨ Other" },
];


export default function InterestsSelect({ value, onChange }) {
  const toggleInterest = (interest) => {
    if (value.includes(interest)) {
      onChange(value.filter((i) => i !== interest));
    } else {
      onChange([...value, interest]);
    }
  };

  const handleSelectChange = (e) => {
    const selected = e.target.value;
    if (!selected) return;
    toggleInterest(selected);
    e.target.selectedIndex = 0;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Sports interests</label>
        <span className="text-[11px] text-muted-foreground">
          Used only to personalise word problems.
        </span>
      </div>

      {/* Dropdown */}
      <select
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
                   text-foreground focus:outline-none focus:ring-2 focus:ring-primary
                   focus:border-transparent"
        onChange={handleSelectChange}
      >
        <option value="">Add an interest…</option>
        {ALL_INTERESTS.map((interest) => (
          <option key={interest.value} value={interest.value}>
            {interest.label}
          </option>
        ))}
      </select>

      {/* Selected chips */}
      <div className="flex flex-wrap gap-2 mt-1">
        {value.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No sports selected yet. Add some so Pixel can theme your math
            questions around games, matches, and races you actually care about.
          </p>
        )}

        {value.map((interest) => {
          const data =
            ALL_INTERESTS.find((i) => i.value === interest) || {
              label: interest,
            };

          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40
                         bg-primary/5 px-3 py-1 text-xs text-foreground hover:bg-primary/10
                         transition-colors"
            >
              {/* Simple, consistent “sport” badge */}
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full
                               bg-primary/30 text-[10px] font-semibold text-primary-foreground">
                S
              </span>
              <span>{data.label}</span>
              <span className="text-[11px] text-muted-foreground">✕</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Later we’ll use these when generating word problems
        (for example: “a soccer match score” instead of a generic story).
      </p>
    </div>
  );
}