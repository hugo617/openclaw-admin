import { StatsCards } from "@/components/dashboard/stats-cards";
import { FileTypeChart } from "@/components/dashboard/file-type-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { DirectorySizeChart } from "@/components/dashboard/directory-size-chart";
import { AgentStatusCard } from "@/components/dashboard/agent-status-card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <StatsCards />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FileTypeChart />
        <DirectorySizeChart />
        <AgentStatusCard />
      </div>
      <RecentActivity />
    </div>
  );
}
