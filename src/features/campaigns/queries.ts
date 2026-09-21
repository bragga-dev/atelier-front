import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import { campaignsApi } from "@/api/endpoints/campaigns";
import { queryKeys } from "@/api/query-keys";
import type { CampaignImageOut } from "@/api/types";

export interface Banner {
  id: string;
  url: string;
  /** Título da campanha — a imagem pode ter texto embutido, então usamos como descrição. */
  alt: string;
}

function runningCampaignsOptions() {
  return queryOptions({
    queryKey: queryKeys.campaigns.running,
    queryFn: ({ signal }) => campaignsApi.running(signal),
    staleTime: 5 * 60_000,
    // Sem banners é um fallback válido (hero estático) — não vale a pena atrasar a home tentando de novo.
    retry: false,
  });
}

function campaignImagesOptions(campaignId: string) {
  return queryOptions({
    queryKey: queryKeys.campaigns.images(campaignId),
    queryFn: ({ signal }) => campaignsApi.images(campaignId, signal),
    staleTime: 5 * 60_000,
  });
}

/** Capa primeiro, depois pela ordem de exibição definida no admin. */
function sortImages(images: CampaignImageOut[]): CampaignImageOut[] {
  return [...images].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.display_order - b.display_order);
}

/**
 * Banners da home = imagens das campanhas vigentes (`/campaigns/running` + `/campaigns/{id}/images`).
 * Falha ao carregar não quebra a home: sem banners, a home mostra o hero estático.
 */
export function useBanners(): { isPending: boolean; banners: Banner[] } {
  const campaigns = useQuery(runningCampaignsOptions());
  const list = campaigns.data ?? [];

  const images = useQueries({
    queries: list.map((campaign) => campaignImagesOptions(campaign.campaign_id)),
  });

  if (campaigns.isPending) return { isPending: true, banners: [] };
  if (images.some((result) => result.isPending)) return { isPending: true, banners: [] };

  const banners = list.flatMap((campaign, index) =>
    sortImages(images[index]?.data ?? []).map((image) => ({
      id: image.campaign_mage_id,
      url: image.image_url,
      alt: campaign.title,
    })),
  );

  return { isPending: false, banners };
}