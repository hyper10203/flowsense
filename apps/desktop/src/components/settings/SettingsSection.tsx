import type { ReactNode } from "react";
import { Card, CardContent } from "../ui/Card.jsx";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps): JSX.Element {
  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-border-subtle">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description && (
          <p className="text-xs text-fg-muted mt-0.5">{description}</p>
        )}
      </div>
      <CardContent className="px-5 py-4 space-y-4">{children}</CardContent>
    </Card>
  );
}
