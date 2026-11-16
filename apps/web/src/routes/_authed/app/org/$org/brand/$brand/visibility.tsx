import { createFileRoute, Link } from "@tanstack/react-router";
import { ALL_MODELS_VALUE } from "@workspace/config/model-filter";
import { PromptsDisplay } from "@/components/prompts-display";
import { batchChartDataQuery } from "@/hooks/use-batch-chart-data";
import { brandDetailQuery } from "@/hooks/use-brands";
import { type BrandFilterSearch, coerceLookback } from "@/hooks/use-list-filters";
import { promptsSummaryQuery } from "@/hooks/use-prompts-summary";
import { useBrandParams } from "@/hooks/use-route-params";
import { getDefaultLookbackPeriod } from "@/lib/chart-utils";
import { coercePromptOrder, DEFAULT_PROMPT_ORDER, type PromptOrder } from "@/lib/prompt-order";
import { pageHead } from "@/lib/route-head";
import { browserTimezone, getViewerTimezone } from "@/lib/viewer-timezone";

export const Route = createFileRoute("/_authed/app/org/$org/brand/$brand/visibility")({
	staticData: { crumb: "Visibility" },
	validateSearch: (search: Record<string, unknown>): { order?: PromptOrder } => {
		const order = coercePromptOrder(search.order);
		return order === DEFAULT_PROMPT_ORDER ? {} : { order };
	},
	loaderDeps: ({ search }: { search: BrandFilterSearch }) => ({ model: search.model, lookback: search.lookback }),
	// Starts the page's two requests without waiting for them: on a first load
	// they travel with the document, and on a navigation they are under way
	// before the page renders (or, with a hovered link, before the click).
	loader: async ({ context, deps }) => {
		// Which calendar days a window covers depends on the viewer's time zone,
		// which the server only knows from an earlier visit.
		const timezone = typeof window === "undefined" ? await getViewerTimezone() : browserTimezone();
		if (!timezone) return;

		const brand = await context.queryClient.ensureQueryData(brandDetailQuery(context.brandId));
		const filters = {
			lookback: coerceLookback(deps.lookback, getDefaultLookbackPeriod(brand.earliestDataDate)),
			model: deps.model && deps.model !== ALL_MODELS_VALUE ? deps.model : undefined,
		};
		void context.queryClient.prefetchQuery(promptsSummaryQuery(context.brandId, filters, timezone));
		void context.queryClient.prefetchQuery(batchChartDataQuery(context.brandId, filters, timezone));
	},
	head: pageHead({ description: "Track how LLMs respond to prompts about your brand." }),
	component: VisibilityPage,
});

function VisibilityPage() {
	const params = useBrandParams();

	const infoContent = (
		<>
			Track how different LLMs respond to prompts related to your brand, products, and{" "}
			<Link to="/app/org/$org/brand/$brand/settings/competitors" params={params} className="underline">
				competitors
			</Link>
			.
		</>
	);

	return (
		<PromptsDisplay
			pageTitle="Visibility"
			pageDescription="See how LLMs are evaluating prompts related to your brand."
			pageInfoContent={infoContent}
		/>
	);
}
