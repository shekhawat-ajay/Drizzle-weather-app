type Props = {
  message?: string;
  onRetry?: () => void;
  variant?: "light" | "dark";
};

export default function ErrorRetry({ message, onRetry, variant = "dark" }: Props) {
  const textClass = variant === "light" ? "text-white/90" : "text-error";
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <p className={`text-sm ${textClass}`}>{message || "Something went wrong!"}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-xs btn-outline">
          Retry
        </button>
      )}
    </div>
  );
}
