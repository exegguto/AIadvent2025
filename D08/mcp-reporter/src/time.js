export function toLocalIsoMinute(date) {
	const d = new Date(date);
	d.setSeconds(0, 0);
	return d.toISOString();
}

export function getHourWindow(now = new Date()) {
	const end = new Date(now);
	end.setMinutes(0, 0, 0);
	const start = new Date(end);
	start.setHours(end.getHours() - 1);
	return { start, end };
}

export function formatHourRangeLocal(start, end) {
	const pad = (n) => String(n).padStart(2, '0');
	const sH = pad(start.getHours());
	const eH = pad(end.getHours());
	return `${sH}:00-${eH}:00`;
}

export function getTodayDateKey(now = new Date()) {
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}
