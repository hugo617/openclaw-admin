"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface FileTypeData {
  name: string;
  count: number;
  size: number;
}

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(186, 75%, 45%)",
  "hsl(326, 100%, 74%)",
  "hsl(47, 96%, 53%)",
];

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileTypeChart() {
  const [data, setData] = useState<FileTypeData[]>([]);

  useEffect(() => {
    fetch("/api/files?mode=stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const dist = res.data.fileTypeDistribution as Record<
            string,
            { count: number; size: number }
          >;
          const chartData = Object.entries(dist)
            .map(([name, val]) => ({ name, ...val }))
            .sort((a, b) => b.size - a.size)
            .slice(0, 8);
          setData(chartData);
        }
      });
  }, []);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-base">File Type Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 animate-pulse rounded bg-muted" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                dataKey="size"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, value }: { name?: string; value?: number }) => `${name} (${value})`}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatSize(Number(value))}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
