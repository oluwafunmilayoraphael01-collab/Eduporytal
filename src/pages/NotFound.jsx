import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5">
      <div className="max-w-lg text-center">
        <SearchX size={56} className="mx-auto text-blue-600" />
        <p className="mt-7 text-sm font-bold uppercase tracking-widest text-blue-600">
          Error 404
        </p>
        <h1 className="mt-3 text-4xl font-extrabold text-gray-900">
          Page not found
        </h1>
        <p className="mt-4 leading-7 text-gray-500">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white hover:bg-blue-700"
        >
          <ArrowLeft size={17} /> Return home
        </Link>
      </div>
    </main>
  );
}

export default NotFound;