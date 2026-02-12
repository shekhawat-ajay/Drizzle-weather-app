export default function Header() {
  return (
    <header className="border-b border-base-content/10 pb-6">
      <div className="flex flex-col items-center gap-1">
        <h1 className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-6xl font-bold tracking-tight text-transparent" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Drizzle
          </h1>
        <p className="text-sm text-base-content/50">
          Real-time weather updates and forecasts
        </p>
      </div>
    </header>
  );
}
