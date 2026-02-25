"use client";

import { LoginScreen } from "./LoginScreen";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  onNip07: () => void;
  onNsec: (nsec: string) => void;
  onBunker: (url: string) => void;
}

export function LoginModal({ isOpen, onClose, loading, error, onNip07, onNsec, onBunker }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[500px] p-0 bg-transparent border-none shadow-none">
        <DialogTitle className="sr-only">Login</DialogTitle>
        <LoginScreen
          loading={loading}
          error={error}
          onNip07={() => { onNip07(); }}
          onNsec={(nsec) => { onNsec(nsec); }}
          onBunker={(url) => { onBunker(url); }}
        />
      </DialogContent>
    </Dialog>
  );
}
