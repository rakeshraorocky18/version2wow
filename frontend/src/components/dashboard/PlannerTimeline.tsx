import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import DashboardCard from './DashboardCard';

export interface PlannerTask {
  time: string;
  title: string;
  day?: string;
}

interface PlannerTimelineProps {
  tasks: PlannerTask[];
  className?: string;
}

export default function PlannerTimeline({ tasks, className = '' }: PlannerTimelineProps) {
  return (
    <DashboardCard className={className} delay={5}>
      <div className="dp-dash-panel-body">
        <div className="dp-dash-section-header">
          <div className="flex items-center gap-2">
            <div className="dp-dash-stat-card__icon !h-9 !w-9">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="dp-dash-section-title !mb-0">Today&apos;s Planner</h2>
              <p className="dp-dash-section-subtitle !mb-0">Your upcoming wedding tasks</p>
            </div>
          </div>
          <Link to="/app/planner" className="dp-dash-link">
            View all →
          </Link>
        </div>

        <div className="dp-dash-timeline">
          {tasks.map((task) => (
            <motion.div
              key={`${task.time}-${task.title}`}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="dp-dash-timeline__item"
            >
              <span className="dp-dash-timeline__dot" />
              <div className="dp-dash-timeline__card">
                {task.day && <p className="dp-dash-timeline__day">{task.day}</p>}
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-[#f4196d]" />
                  <span className="dp-dash-timeline__time">{task.time}</span>
                </div>
                <p className="dp-dash-timeline__title">{task.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
