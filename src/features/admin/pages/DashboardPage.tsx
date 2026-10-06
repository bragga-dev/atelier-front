// frontend/src/features/admin/pages/DashboardPage.tsx
import { useMemo, useState } from "react";
import { AlertTriangle, Download, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import { dashboardApi } from "@/api/endpoints/admin";
import { toUserMessage } from "@/api/errors";
import { DataTable } from "@/components/panel/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { Section } from "@/components/panel/Section";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Link } from "react-router";
import { useDashboard } from "../hooks";

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function Stat({ icon: Icon, label, value }: { icon: typeof ShoppingBag; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-sand-200 bg-white p-5">
      <span className="grid size-12 place-items-center rounded-full bg-gold-300/30 text-gold-600"><Icon className="size-6" aria-hidden="true" /></span>
      <div><p className="text-sm text-ink-soft">{label}</p><p className="text-2xl font-semibold">{value}</p></div>
    </div>
  );
}

export default function DashboardPage() {
  const today = useMemo(() => new Date(), []);
  const [start, setStart] = useState(isoDay(new Date(today.getTime() - 29 * 86_400_000)));
  const [end, setEnd] = useState(isoDay(today));
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  // Só pedidos pagos entram no faturamento.
  const params = { startDate: start, endDate: end, status: "COMPLETED" };
  const summary = useDashboard(params);
  const data = summary.data;

  const exportOrders = async (format: "csv" | "xlsx") => {
    setExporting(format);
    try {
      const blob = await dashboardApi.exportOrders({ format, startDate: start, endDate: end });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedidos-${start}_${end}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(toUserMessage(error, "Não foi possível exportar."));
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Vendas de pedidos pagos no período."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportOrders("csv")} loading={exporting === "csv"}><Download className="size-4" aria-hidden="true" />CSV</Button>
            <Button variant="outline" size="sm" onClick={() => exportOrders("xlsx")} loading={exporting === "xlsx"}><Download className="size-4" aria-hidden="true" />Excel</Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:max-w-md sm:grid-cols-2">
        <TextField label="De" type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} />
        <TextField label="Até" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
      </div>

      {summary.isPending ? (
        <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      ) : summary.isError || !data ? (
        <ErrorState error={summary.error} onRetry={() => void summary.refetch()} retrying={summary.isFetching} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat icon={ShoppingBag} label="Pedidos pagos" value={String(data.total_orders)} />
            <Stat icon={TrendingUp} label="Faturamento" value={formatBRL(data.total_revenue)} />
            <Stat icon={Receipt} label="Ticket médio" value={formatBRL(data.average_ticket)} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Produtos mais vendidos">
              {data.top_products.length === 0 ? <p className="text-sm text-ink-soft">Sem vendas no período.</p> : (
                <DataTable caption="Produtos mais vendidos" rows={data.top_products} rowKey={(r) => r.product_id}
                  columns={[
                    { header: "Produto", cell: (r) => <span className="font-semibold">{r.product_name}</span> },
                    { header: "Qtd.", cell: (r) => r.quantity_sold },
                    { header: "Receita", cell: (r) => formatBRL(r.revenue) },
                  ]} />
              )}
            </Section>
            <Section title="Categorias mais vendidas">
              {data.top_categories.length === 0 ? <p className="text-sm text-ink-soft">Sem vendas no período.</p> : (
                <DataTable caption="Categorias mais vendidas" rows={data.top_categories} rowKey={(r) => r.product_category_id}
                  columns={[
                    { header: "Categoria", cell: (r) => <span className="font-semibold">{r.category_name}</span> },
                    { header: "Qtd.", cell: (r) => r.quantity_sold },
                    { header: "Receita", cell: (r) => formatBRL(r.revenue) },
                  ]} />
              )}
            </Section>
          </div>

          <Section title="Estoque baixo" description="Produtos ativos com poucas unidades.">
            {data.low_stock_products.length === 0 ? <p className="text-sm text-ink-soft">Nenhum produto com estoque baixo. 🎉</p> : (
              <ul className="divide-y divide-sand-200">
                {data.low_stock_products.map((p) => (
                  <li key={p.product_id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-gold-600" aria-hidden="true" />{p.product_name}</span>
                    <span className="flex items-center gap-3 text-sm"><span>{p.stock} un.</span><Link to={`/admin/produtos/${p.product_id}`} className="font-semibold text-oxblood-700 hover:underline">Repor</Link></span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </>
  );
}