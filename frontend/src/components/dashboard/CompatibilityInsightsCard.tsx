// import DashboardCard from './DashboardCard';
// import CircularProgressRing from './CircularProgressRing';
// import type { DashboardCompatibilityInsight } from '../../hooks/useDashboard';

// interface CompatibilityInsightsCardProps {
//   overallScore: number;
//   insights: DashboardCompatibilityInsight[];
// }

// export default function CompatibilityInsightsCard({
//   overallScore,
//   insights,
// }: CompatibilityInsightsCardProps) {
//   return (
//     <DashboardCard className="wow-compatibility-card" delay={2}>
//       <div className="dp-dash-panel-body">
//         <div className="flex flex-wrap items-start justify-between gap-3">
//           <div>
//             <p className="wow-section-kicker">Compatibility Insights</p>
//             <h2 className="wow-section-title">Luxury Match Analysis</h2>
//             <p className="wow-section-subtitle">
//               A quick view of the strongest compatibility dimensions shaping your next connection.
//             </p>
//           </div>

//           <div className="relative shrink-0">
//             <CircularProgressRing
//               percent={overallScore}
//               size={96}
//               strokeWidth={7}
//               gradientId="wowCompatibilityRing"
//             />
//             <div className="absolute inset-0 flex flex-col items-center justify-center">
//               <span className="text-[1.5rem] font-semibold text-[#2C2630]">{overallScore}%</span>
//               <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#6B6670]">
//                 Overall
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="mt-4 space-y-3">
//           {insights.slice(0, 7).map((item) => (
//             <div key={item.label}>
//               <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
//                 <span className="font-medium text-[#2C2630]">{item.label}</span>
//                 <span className="font-semibold text-[#B76E79]">{item.score}%</span>
//               </div>
//               <div className="wow-luxe-progress">
//                 <div
//                   className="wow-luxe-progress__fill"
//                   style={{ width: `${Math.max(6, Math.min(100, item.score))}%` }}
//                 />
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </DashboardCard>
//   );
// }
