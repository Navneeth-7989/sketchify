import Link from "next/link";
import type { ReactNode } from "react";

const GRID_BG = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
  backgroundSize: "34px 34px",
};

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070809] px-4 py-8">
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-teal-500/10 blur-[120px]" />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0c0d10] shadow-2xl shadow-black/70 ring-1 ring-white/5 lg:grid-cols-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-gradient-to-br from-[#15171d] via-[#101216] to-[#0a0b0d] p-10 lg:flex">
          <div className="pointer-events-none absolute inset-0" style={GRID_BG} />
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/[0.06] blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />

          <Link
            href="/"
            className="relative z-10 flex items-center gap-2.5 text-lg font-bold tracking-tight text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-white to-gray-300 text-base shadow-lg shadow-black/40">
              ✏️
            </span>
            Sketchify
          </Link>

          <div className="relative z-10">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
              Where ideas
              <br />
              take shape.
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
              A fast, infinite canvas for sketching diagrams, wireframes, and
              whatever else is on your mind.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Infinite, buttery-smooth canvas",
                "Export to PNG, SVG, or a shareable link",
                "Real-time collaboration",
              ].map((feat) => (
                <li
                  key={feat}
                  className="flex items-center gap-3 text-sm text-gray-300"
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                    <CheckIcon />
                  </span>
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-gray-600">
            © {new Date().getFullYear()} Sketchify
          </p>
        </div>

        <div className="relative flex flex-col justify-center bg-[#0c0d10] px-7 py-10 sm:px-10">
          <div className="mx-auto w-full max-w-sm animate-[fadeIn_0.45s_ease-out]">
            <Link
              href="/"
              className="mb-8 flex items-center justify-center gap-2 text-lg font-bold tracking-tight text-white lg:hidden"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-white to-gray-300 text-base">
                ✏️
              </span>
              Sketchify
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              {title}
            </h1>
            <p className="mb-7 mt-1.5 text-sm text-gray-400">{subtitle}</p>

            {children}

            <p className="mt-7 text-center text-sm text-gray-400">{footer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-sky-300"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
