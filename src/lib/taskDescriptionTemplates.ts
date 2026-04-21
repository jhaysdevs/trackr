import type { Task, TaskType } from '@/types';

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** Plain-text-ish check: user cleared the editor or left placeholder-only. */
export function isHtmlDescriptionEmpty(html: string): boolean {
	const plain = html
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return plain.length === 0;
}

export function pickRelatedTaskTitles(
	tasks: Task[],
	type: TaskType,
	excludeTitle: string,
	limit: number
): string[] {
	const ex = excludeTitle.trim().toLowerCase();
	const seen = new Set<string>();
	const out: string[] = [];
	for (const t of tasks) {
		if (t.type !== type) continue;
		const title = t.title.trim();
		if (!title || title.toLowerCase() === ex) continue;
		const key = title.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(title);
		if (out.length >= limit) break;
	}
	return out;
}

export interface DefaultDescriptionOptions {
	title: string;
	type: TaskType;
	projectName?: string | null;
	relatedTitles: string[];
}

/**
 * Rich HTML for TipTap (StarterKit): headings, lists, emphasis, inline code.
 */
export function buildDefaultTaskDescriptionHtml(o: DefaultDescriptionOptions): string {
	const title = o.title.trim();
	const titleLine = title
		? `<p><strong>Working title:</strong> ${escapeHtml(title)}</p>`
		: `<p><em>Add a title above — it will stay in sync while this description matches the template.</em></p>`;

	const projectLine =
		o.projectName?.trim() ?
			`<p><strong>Project:</strong> ${escapeHtml(o.projectName.trim())}</p>`
		:	'<p><strong>Project:</strong> <em>Select a project if applicable.</em></p>';

	const relatedBlock =
		o.relatedTitles.length > 0 ?
			`<h2>Similar work in this tracker</h2><ul>${o.relatedTitles.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
		:	'';

	function tail(): string {
		return [relatedBlock].filter(Boolean).join('');
	}

	switch (o.type) {
		case 'bug':
			return [
				'<h2>Summary</h2>',
				titleLine,
				projectLine,
				'<h2>Steps to reproduce</h2>',
				'<ol><li></li><li></li><li></li></ol>',
				'<h2>Expected result</h2>',
				'<p></p>',
				'<h2>Actual result</h2>',
				'<p></p>',
				'<h2>Environment</h2>',
				'<ul><li><code>Browser / OS / app version</code></li><li><code>Build or release</code></li></ul>',
				tail(),
			].join('');

		case 'feature':
		case 'enhancement':
		case 'ui_ux':
			return [
				'<h2>Problem</h2>',
				'<p>What user or business problem does this solve?</p>',
				titleLine,
				projectLine,
				'<h2>Proposed approach</h2>',
				'<p></p>',
				'<h2>Acceptance criteria</h2>',
				'<ul><li></li><li></li></ul>',
				'<h2>Out of scope</h2>',
				'<p><em>Optional — clarify boundaries.</em></p>',
				tail(),
			].join('');

		case 'documentation':
			return [
				'<h2>Audience</h2>',
				'<p>Who will read this (role / experience level)?</p>',
				titleLine,
				projectLine,
				'<h2>Outline</h2>',
				'<ol><li></li><li></li><li></li></ol>',
				'<h2>Draft</h2>',
				'<p></p>',
				tail(),
			].join('');

		case 'spike':
			return [
				'<h2>Question</h2>',
				'<p>What unknown are we trying to reduce?</p>',
				titleLine,
				projectLine,
				'<h2>Time box</h2>',
				'<p><em>e.g. 1–2 days</em></p>',
				'<h2>Findings</h2>',
				'<ul><li></li></ul>',
				'<h2>Recommendation</h2>',
				'<p></p>',
				tail(),
			].join('');

		case 'tech_debt':
		case 'refactor':
			return [
				'<h2>Context</h2>',
				'<p>What code or system area is affected?</p>',
				titleLine,
				projectLine,
				'<h2>Pain today</h2>',
				'<ul><li></li><li></li></ul>',
				'<h2>Proposed refactor</h2>',
				'<p></p>',
				'<h2>Risks / rollout</h2>',
				'<p></p>',
				tail(),
			].join('');

		case 'performance':
		case 'security':
			return [
				'<h2>Summary</h2>',
				titleLine,
				projectLine,
				'<h2>Scope</h2>',
				'<p>Components, endpoints, or assets involved.</p>',
				'<h2>Evidence</h2>',
				'<ul><li><code>Metrics, traces, or reports</code></li></ul>',
				'<h2>Remediation plan</h2>',
				'<ol><li></li><li></li></ol>',
				tail(),
			].join('');

		case 'devops':
		case 'testing':
		case 'integration':
			return [
				'<h2>Goal</h2>',
				'<p>What pipeline, suite, or integration changes?</p>',
				titleLine,
				projectLine,
				'<h2>Checklist</h2>',
				'<ul><li></li><li></li><li></li></ul>',
				'<h2>Rollback / validation</h2>',
				'<p></p>',
				tail(),
			].join('');

		case 'accessibility':
			return [
				'<h2>Summary</h2>',
				titleLine,
				projectLine,
				'<h2>WCAG / standard</h2>',
				'<p><em>e.g. 2.4.7 Focus visible</em></p>',
				'<h2>Current behaviour</h2>',
				'<p></p>',
				'<h2>Expected behaviour</h2>',
				'<p></p>',
				'<h2>Verification</h2>',
				'<ul><li>Keyboard</li><li>Screen reader</li><li>Contrast</li></ul>',
				tail(),
			].join('');

		default:
			return [
				'<h2>Context</h2>',
				titleLine,
				projectLine,
				'<h2>Details</h2>',
				'<p></p>',
				'<h2>Next steps</h2>',
				'<ul><li></li><li></li></ul>',
				tail(),
			].join('');
	}
}
