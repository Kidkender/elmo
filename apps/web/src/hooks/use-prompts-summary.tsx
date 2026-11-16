import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHydrated } from "@tanstack/react-router";
import { useResolvedBrandId } from "@/hooks/use-brand-id";
import type { LookbackPeriod } from "@/lib/lookback";
import { browserTimezone } from "@/lib/viewer-timezone";
import { getPromptsSummaryFn } from "@/server/prompts";

export interface PromptsSummaryFilters {
	lookback?: LookbackPeriod;
	webSearchEnabled?: boolean;
	model?: string;
}

export const promptsSummaryKeys = {
	all: ["prompts-summary"] as const,
	list: (brandId: string, filters: PromptsSummaryFilters | undefined, timezone: string) =>
		[...promptsSummaryKeys.all, brandId, filters, timezone] as const,
};

/** Shared with route loaders, so what they request ahead of time is what the hook then finds. */
export const promptsSummaryQuery = (brandId: string, filters: PromptsSummaryFilters | undefined, timezone: string) => ({
	queryKey: promptsSummaryKeys.list(brandId, filters, timezone),
	queryFn: () =>
		getPromptsSummaryFn({
			data: {
				brandId,
				lookback: filters?.lookback || "1m",
				webSearchEnabled: filters?.webSearchEnabled?.toString(),
				model: filters?.model,
				timezone,
			},
		}),
	staleTime: 30_000,
});

export function usePromptsSummary(brandId?: string, filters?: PromptsSummaryFilters) {
	const resolvedBrandId = useResolvedBrandId(brandId);
	// A loader may have delivered this with the document, but the server
	// rendered the loading state, so the first render in the browser has to too.
	const hydrated = useHydrated();

	const query = useQuery({
		...promptsSummaryQuery(resolvedBrandId || "", filters, browserTimezone()),
		enabled: !!resolvedBrandId,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		refetchInterval: 60_000,
		placeholderData: (prev) => prev,
	});

	return {
		data: hydrated ? query.data : undefined,
		isLoading: !hydrated || query.isLoading,
		error: query.error,
		refetch: query.refetch,
	};
}

export function useInvalidatePromptsSummary() {
	const queryClient = useQueryClient();

	return (brandId: string) => {
		queryClient.invalidateQueries({
			queryKey: [...promptsSummaryKeys.all, brandId],
		});
	};
}
