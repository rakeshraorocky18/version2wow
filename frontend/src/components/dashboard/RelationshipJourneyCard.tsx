import DashboardCard from './DashboardCard';
import type { DashboardJourneyStep } from '../../hooks/useDashboard';

interface RelationshipJourneyCardProps {
  steps: DashboardJourneyStep[];
}

export default function RelationshipJourneyCard({
  steps,
}: RelationshipJourneyCardProps) {
  return (
    <DashboardCard className="wow-journey-card" delay={3}>
      <div className="dp-dash-panel-body">
        <p className="wow-section-kicker">Match Journey</p>
        <h2 className="wow-section-title">Relationship Timeline</h2>
        <p className="wow-section-subtitle">
          Follow the emotional path from discovery to your wedding journey.
        </p>

        <div className="wow-journey-list">
          {steps.map((step) => (
            <div key={step.label} className={`wow-journey-item is-${step.state}`}>
              <span className="wow-journey-item__dot" aria-hidden>
                {step.state === 'complete' ? '✓' : step.state === 'current' ? '●' : '○'}
              </span>
              <span className="wow-journey-item__label">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
