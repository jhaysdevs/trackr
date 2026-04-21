import type { Metadata } from 'next';
import { NewTaskShell } from './NewTaskShell';

export const metadata: Metadata = { title: 'New Task' };

export default function NewTaskPage() {
	return <NewTaskShell />;
}
