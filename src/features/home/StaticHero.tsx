import { Link } from "react-router";
import { MandalaLogo } from "@/components/brand/MandalaLogo";
import { buttonStyles } from "@/components/ui/button-styles";

/** Hero da marca — usado quando não há campanhas com banner ativas. */
export function StaticHero() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-parchment shadow-card">
      <div className="grid items-center lg:grid-cols-[1.05fr_1fr]">
        <div className="px-6 pb-2 pt-10 sm:px-12 sm:pt-14 lg:py-20 lg:pl-16 lg:pr-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oxblood-700">Artesanato com alma</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
            Peças feitas à mão, com tradição e cuidado.
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            Objetos únicos de artesanato para deixar a sua casa e os seus dias mais bonitos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/produtos" className={buttonStyles({ size: "lg" })}>
              Ver produtos
            </Link>
            <Link to="/contato" className={buttonStyles({ size: "lg", variant: "outline" })}>
              Falar com a loja
            </Link>
          </div>
        </div>

        <div className="flex justify-center px-6 pb-8 pt-4 lg:p-8">
          <MandalaLogo priority className="max-w-[24rem] lg:max-w-[32rem]" />
        </div>
      </div>
    </div>
  );
}