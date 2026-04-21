import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import styles from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
	size?: 'sm' | 'md' | 'lg';
	loading?: boolean;
	icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{
		variant = 'secondary',
		size = 'md',
		loading = false,
		icon,
		children,
		className,
		disabled,
		...rest
	},
	ref
) {
	return (
		<button
			ref={ref}
			disabled={disabled || loading}
			className={cn(
				styles.button,
				styles[`variant-${variant}`],
				styles[`size-${size}`],
				loading && styles.loading,
				className
			)}
			{...rest}
		>
			{icon}
			{children}
		</button>
	);
});
