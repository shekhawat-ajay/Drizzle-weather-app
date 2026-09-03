import { TriangleAlert } from "lucide-react";

type Props = {
  message?: string;
  onRetry?: () => void;
  variant?: "light" | "dark";
};

export default function ErrorRetry({ message, onRetry, variant = "dark" }: Props) {
  return (
    <div
      role="alert"
      className={`alert ${variant === "light" ? "alert-soft" : "alert-error"} my-4 sm:alert-horizontal`}
    >
      <TriangleAlert size={16} className="shrink-0" />
      <span className="text-sm">{message || "Something went wrong!"}</span>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-xs">
          Retry
        </button>
      )}
    </div>
  );
}
