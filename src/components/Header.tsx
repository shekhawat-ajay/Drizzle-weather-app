export default function Header() {
  return (
    <header className="flex w-full flex-col items-center">
      <h1 className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text p-2 text-6xl font-medium text-transparent">
        Drizzle
      </h1>
      <p className="m-2 text-center text-balance text-neutral-500">
        Get real-time weather updates and forecasts for any location.
      </p>
    </header>
  );
}
