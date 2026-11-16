import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const COOKIE = "tz";

/**
 * The time zone the browser reported on an earlier visit, so the server can
 * load the same calendar-day window the browser is about to ask for. Null on a
 * first visit, when only the browser knows.
 */
export const getViewerTimezone = createServerFn({ method: "GET" }).handler((): string | null => {
	const cookies = getRequest().headers.get("cookie") ?? "";
	const match = cookies.split(/;\s*/).find((cookie) => cookie.startsWith(`${COOKIE}=`));
	if (!match) return null;
	const timezone = decodeURIComponent(match.slice(COOKIE.length + 1));
	try {
		Intl.DateTimeFormat("en-CA", { timeZone: timezone });
		return timezone;
	} catch {
		return null;
	}
});

export function browserTimezone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function rememberViewerTimezone(): void {
	document.cookie = `${COOKIE}=${encodeURIComponent(browserTimezone())}; path=/; max-age=31536000; samesite=lax`;
}
