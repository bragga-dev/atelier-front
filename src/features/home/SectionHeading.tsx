import { Link } from "react-router";

export function SectionHeading({ title, linkTo, linkLabel }: { title: string; linkTo: string; linkLabel: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
      <Link to={linkTo} className="shrink-0 text-sm font-semibold uppercase tracking-[0.12em] text-oxblood-700 hover:underline">
        {linkLabel}
      </Link>
    </div>
  );
}