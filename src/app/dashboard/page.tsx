import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ReportCard from "@/components/ReportCard";
import { mockReports } from "@/lib/data";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/report/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Report
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Recent Reports</h2>
        {mockReports.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mockReports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                ))}
            </div>
        ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You haven't created any reports yet.</p>
                <Button asChild className="mt-4">
                    <Link href="/report/new">Create Your First Report</Link>
                </Button>
            </div>
        )}
      </div>
    </DashboardLayout>
  );
}
