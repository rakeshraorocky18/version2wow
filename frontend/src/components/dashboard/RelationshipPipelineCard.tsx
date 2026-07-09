import DashboardCard from './DashboardCard';
import type { DashboardPipelineStage } from '../../hooks/useDashboard';

interface RelationshipPipelineCardProps {
  stages: DashboardPipelineStage[];
}

export default function RelationshipPipelineCard({
  stages,
}: RelationshipPipelineCardProps) {
  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);

  return (
    <DashboardCard className="wow-pipeline-card" delay={5}>
      <div className="dp-dash-panel-body">
        <p className="wow-section-kicker">Relationship Pipeline</p>
        <h2 className="wow-section-title">Your journey from discovery to commitment</h2>
        <p className="wow-section-subtitle">
          A clear view of how interest is turning into trust, conversation, and real progress.
        </p>

        <div className="wow-pipeline-card__list">
          {stages.map((stage, index) => (
            <div key={stage.label} className="wow-pipeline-card__item">
              <div className="wow-pipeline-card__node">
                <span>{stage.value}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#2C2630]">{stage.label}</p>
                  <span className="text-xs font-medium text-[#7D7079]">{stage.value}</span>
                </div>
                <div className="wow-pipeline-card__track">
                  <div
                    className="wow-pipeline-card__fill"
                    style={{ width: `${Math.max(8, (stage.value / maxValue) * 100)}%` }}
                  />
                </div>
              </div>
              {index < stages.length - 1 && <span className="wow-pipeline-card__arrow">↓</span>}
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
