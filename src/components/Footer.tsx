export default function Footer() {
  return (
    <footer className="border-base-content/10 mt-8 border-t py-6 text-center">
      <p className="text-base-content/40 text-sm">
        Made with ❤️ by{" "}
        <a
          className="text-base-content/60 hover:text-primary transition-colors duration-200"
          target="_blank"
          href="https://github.com/shekhawat-ajay"
        >
          Ajay Shekhawat
        </a>
      </p>
      <p className="text-base-content/30 mt-2 text-xs">
        © {new Date().getFullYear()} Drizzle. All rights reserved.
      </p>
    </footer>
  );
}
