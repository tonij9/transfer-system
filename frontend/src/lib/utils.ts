export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'bg-red-600',
    in_progress: 'bg-yellow-600',
    pending: 'bg-blue-600',
    resolved: 'bg-green-600',
    closed: 'bg-gray-600',
    // Transfer statuses
    processing: 'bg-yellow-600',
    completed: 'bg-green-600',
    failed: 'bg-red-600',
    rejected: 'bg-red-600',
    // JIRA statuses
    'To Do': 'bg-gray-600',
    'In Progress': 'bg-blue-600',
    'Done': 'bg-green-600',
  };
  return colors[status] || 'bg-gray-600';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-gray-500',
    normal: 'bg-blue-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
    Low: 'bg-gray-500',
    Medium: 'bg-blue-500',
    High: 'bg-orange-500',
    Critical: 'bg-red-500',
  };
  return colors[priority] || 'bg-gray-500';
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
