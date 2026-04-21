import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import styles from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{ label, error, className, id, ...rest },
	ref
) {
	const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
	return (
		<div className={styles.wrapper}>
			{label && (
				<label className={styles.label} htmlFor={inputId}>
					{label}
				</label>
			)}
			<input
				ref={ref}
				id={inputId}
				className={cn(styles.input, error && styles.error, className)}
				{...rest}
			/>
			{error && <span className={styles['error-msg']}>{error}</span>}
		</div>
	);
});
