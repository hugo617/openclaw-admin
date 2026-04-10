import { StatsCards } from "@/components/dashboard/stats-cards";
import { FileTypeChart } from "@/components/dashboard/file-type-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <StatsCards />
      <div className="grid gap-6 md:grid-cols-2">
        <FileTypeChart />
        <RecentActivity />
      </div>
    </div>
  );
}
