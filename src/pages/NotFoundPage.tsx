import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-6xl font-bold text-base-content/20">404</h2>
      <p className="mt-2 text-base-content/60">Page not found</p>
      <Link to="/" className="btn btn-sm btn-primary mt-6">
        Back to Weather
      </Link>
      <Link to="/astronomy/overview" className="btn btn-sm btn-ghost mt-2">
        Go to Astronomy Overview
      </Link>
    </div>
  );
}
