import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Store } from "@/lib/firebase/types";

interface DuplicateConfirmationModalProps {
  isOpen: boolean;
  duplicates: Store[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DuplicateConfirmationModal({
  isOpen,
  duplicates,
  onConfirm,
  onCancel,
}: DuplicateConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Possible Duplicate Store</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            A store with a similar name and province already exists. Are you sure you want to create a new store?
          </p>
          <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
            <ul className="space-y-2">
              {duplicates.map((dup) => (
                <li key={dup.id} className="text-sm">
                  <strong>{dup.tradingName}</strong> - {dup.streetAddress}, {dup.province}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={onConfirm}>
            Create Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
