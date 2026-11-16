import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const COOKIE = "tz";

/** Null on a first visit, when only the browser knows its time zone. */
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
