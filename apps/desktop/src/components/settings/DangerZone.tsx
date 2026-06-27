import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { Card, CardContent } from "../ui/Card.jsx";
import { Dialog } from "../ui/Dialog.jsx";

interface DangerZoneProps {
  onClearHistory: () => void;
  onExportData: () => void;
}

export function DangerZone({
  onClearHistory,
  onExportData,
}: DangerZoneProps): JSX.Element {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Card className="border-danger/20">
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-danger" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-fg">Danger zone</h3>
            <p className="text-xs text-fg-muted mt-0.5">
              Destructive actions. Proceed with caution.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onExportData}>
            Export data
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmOpen(true)}
          >
            Clear history
          </Button>
        </div>
      </CardContent>
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Clear all history?"
        description="This permanently removes all tracked activity from this device. This cannot be undone."
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onClearHistory();
              setConfirmOpen(false);
            }}
          >
            Yes, clear everything
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
