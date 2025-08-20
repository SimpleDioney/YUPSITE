import { cn } from "@/lib/utils";

interface PriceProps {
  amount: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Price({ amount, className, size = 'md' }: PriceProps) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount); 

  return (
    <span className={cn('font-semibold text-foreground', sizeClasses[size], className)}>
      {formattedPrice}
    </span>
  );
}