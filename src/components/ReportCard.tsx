import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Report } from "@/lib/definitions";
import { formatDistanceToNow } from "date-fns";
import {
  Car,
  CloudRain,
  AlertTriangle,
  Users,
  MapPin,
  Calendar,
  HeartPulse,
} from "lucide-react";

const reportIcons: Record<string, JSX.Element> = {
  Medical: <HeartPulse className="w-6 h-6 text-blue-500" />,
  Fire: <AlertTriangle className="w-6 h-6 text-red-500" />,
  Accident: <Car className="w-6 h-6 text-yellow-500" />,
  "Natural Disaster": (
    <CloudRain className="w-6 h-6 text-green-500" />
  ),
  Other: <AlertTriangle className="w-6 h-6 text-gray-500" />,
};

const statusVariant: {
  [key: string]: "default" | "secondary" | "destructive" | "outline";
} = {
  New: "default",
  "In Progress": "secondary",
  Resolved: "outline",
};

export default function ReportCard({ report }: { report: Report }) {
  const icon =
    reportIcons[report.type] ??
    <AlertTriangle className="w-6 h-6 text-gray-500" />;

  const badgeVariant = statusVariant[report.status] ?? "default";

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 font-headline text-xl">
              {icon}
              {report.type}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4" />
              {formatDistanceToNow(report.createdAt, { addSuffix: true })}
            </CardDescription>
          </div>
          <Badge variant={badgeVariant}>{report.status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-muted-foreground line-clamp-2">
          {report.notes}
        </p>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span>{report.peopleAffected} person(s)</span>
        </div>

        {report.isInjury && (
          <div className="flex items-center gap-2 text-destructive">
            <HeartPulse className="w-4 h-4" />
            <span>Injury reported</span>
          </div>
        )}

        <div className="flex items-center gap-2 col-span-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span>
            {report.location.latitude.toFixed(4)},{" "}
            {report.location.longitude.toFixed(4)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
