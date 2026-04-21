// Nano-ID style cuid2-compatible ID generator (avoids adding another dep)
export function createId(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	const arr = new Uint8Array(24);
	crypto.getRandomValues(arr);
	return Array.from(arr, (n) => chars[n % chars.length]).join('');
}

export function cn(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(' ');
}

export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function formatDate(
	date: Date | string,
	style: 'relative' | 'short' | 'long' = 'short'
): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffDays = Math.floor(diffMs / 86_400_000);

	if (style === 'relative') {
		if (diffMs < 60_000) return 'just now';
		if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
		if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	if (style === 'short') {
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	return d.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});
}
