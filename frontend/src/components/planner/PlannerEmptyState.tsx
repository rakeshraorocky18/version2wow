import { CalendarHeart, ClipboardList, SearchX } from 'lucide-react';

type EmptyVariant = 'no-plans' | 'no-tasks' | 'no-results';

interface PlannerEmptyStateProps {
  variant: EmptyVariant;
  action?: React.ReactNode;
}

const config: Record<
  EmptyVariant,
  { icon: typeof CalendarHeart; title: string; description: string; accent: string }
> = {
  'no-plans': {
    icon: CalendarHeart,
    title: 'Start planning your wedding',
    description: 'Create your first wedding plan to get an auto-generated timeline, tasks, and progress tracking.',
    accent: 'from-[#FFF0F5] to-[#F8F5FF]',
  },
  'no-tasks': {
    icon: ClipboardList,
    title: 'No tasks yet',
    description: 'Your checklist will appear here once tasks are added to this plan.',
    accent: 'from-[#FFFBFC] to-[#FFF5F8]',
  },
  'no-results': {
    icon: SearchX,
    title: 'No matching tasks',
    description: 'Try adjusting your search or filters to find what you are looking for.',
    accent: 'from-[#F5FAFF] to-[#FFFBFC]',
  },
};

export default function PlannerEmptyState({ variant, action }: PlannerEmptyStateProps) {
  const { icon: Icon, title, description, accent } = config[variant];

  return (
    <div className={`rounded-3xl border border-dashed border-[#E5C8D5] bg-gradient-to-br ${accent} px-6 py-14 text-center`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#F2DFE8]">
        <Icon size={30} className="text-[#B66A8A]" />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold text-[#5D2B44]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#815A6D]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
