"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatSize } from "@/lib/format";

interface DirSizeData {
  name: string;
  size: number;
}

export function DirectorySizeChart() {
  const [data, setData] = useState<DirSizeData[]>([]);

  useEffect(() => {
    fetch("/api/files?mode=stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data.directorySizes ?? []);
        }
      });
  }, []);

  if (data.length === 0) {
    return <div className="h-64 animate-pulse rounded bg-muted" />;
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-base">Directory Size Ranking (Top 10)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => formatSize(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={70}
              tick={{ fontSize: 12 }}
            />
            <Tooltip formatter={(value) => formatSize(Number(value))} />
            <Bar
              dataKey="size"
              fill="hsl(221, 83%, 53%)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
