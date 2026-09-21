import { http } from "../http";
import type { CampaignImageOut, CampaignOut } from "../types";

export const campaignsApi = {
  running: (signal?: AbortSignal) => http.get<CampaignOut[]>("/campaigns/running", { signal, auth: false }),

  images: (campaignId: string, signal?: AbortSignal) =>
    http.get<CampaignImageOut[]>(`/campaigns/${campaignId}/images`, { signal, auth: false }),
};