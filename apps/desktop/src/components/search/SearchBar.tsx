import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/Input.jsx";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  autoFocus = false,
  placeholder = "Search apps, URLs, titles…",
}: SearchBarProps): JSX.Element {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => ref.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onChange("");
        ref.current?.blur();
      }
    };
    const el = ref.current;
    el?.addEventListener("keydown", onKey);
    return () => el?.removeEventListener("keydown", onKey);
  }, [onChange]);

  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
      />
      <Input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 h-11 text-base"
      />
    </div>
  );
}
