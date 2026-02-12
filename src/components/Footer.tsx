export default function Footer() {
  return (
    <footer className="mt-8 border-t border-base-content/10 py-6 text-center">
      <p className="text-sm text-base-content/40">
        Made with ❤️ by{" "}
        <a
          className="text-base-content/60 transition-colors duration-200 hover:text-primary"
          target="_blank"
          href="https://github.com/shekhawat-ajay"
        >
          Ajay Shekhawat
        </a>
      </p>
      <p className="mt-2 text-xs text-base-content/30">
        © {new Date().getFullYear()} Drizzle. All rights reserved.
      </p>
    </footer>
  );
}
