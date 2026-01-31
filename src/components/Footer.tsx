export default function Footer() {
  return (
    <footer className="bg-base-200 p-8 text-center text-sm text-white">
      <p className="mb-4 tracking-wider">
        Made with ❤️ by{" "}
        <a
          className="underline decoration-wavy underline-offset-5"
          target="_blank"
          href="https://github.com/shekhawat-ajay"
        >
          Ajay Shekhawat
        </a>
      </p>
      <p>© {new Date().getFullYear()} Drizzle. All rights reserved.</p>
    </footer>
  );
}
