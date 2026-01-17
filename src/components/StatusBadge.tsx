import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type LoanStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'completed';
type PaymentStatus = 'pending' | 'paid' | 'overdue';

interface StatusBadgeProps {
  status: LoanStatus | PaymentStatus;
  type?: 'loan' | 'payment';
}

const loanStatusConfig: Record<LoanStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  under_review: {
    label: 'Em Análise',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  approved: {
    label: 'Aprovado',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  rejected: {
    label: 'Recusado',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  disbursed: {
    label: 'Liberado',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  completed: {
    label: 'Finalizado',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  paid: {
    label: 'Pago',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  overdue: {
    label: 'Atrasado',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function StatusBadge({ status, type = 'loan' }: StatusBadgeProps) {
  const config = type === 'loan' 
    ? loanStatusConfig[status as LoanStatus] 
    : paymentStatusConfig[status as PaymentStatus];

  return (
    <Badge variant="secondary" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}
