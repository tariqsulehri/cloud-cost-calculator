import { AlertTriangle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="flex gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3.5 text-sm text-orange-900 shadow-sm">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-orange-100">
        <AlertTriangle className="h-4 w-4 text-orange-700" aria-hidden="true" />
      </span>
      <span className="pt-0.5">{message}</span>
    </div>
  );
}
