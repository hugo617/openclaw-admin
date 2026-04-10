"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Skill {
  name: string;
  hasSkillMd: boolean;
}

interface Plugin {
  name: string;
  hasConfig: boolean;
  skillCount: number;
  skills: Skill[];
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plugins")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPlugins(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalSkills = plugins.reduce((sum, p) => sum + p.skillCount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Installed Plugins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plugins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSkills}</div>
          </CardContent>
        </Card>
      </div>

      {/* Plugin List */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-lg" />
          ))}
        </div>
      ) : plugins.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No plugins installed
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plugins.map((plugin) => (
            <Card key={plugin.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plugin.name}</CardTitle>
                  <div className="flex gap-2">
                    {plugin.hasConfig && (
                      <Badge variant="outline">Configured</Badge>
                    )}
                    <Badge variant="secondary">
                      {plugin.skillCount} skill{plugin.skillCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {plugin.skills.length > 0 ? (
                  <div className="space-y-2">
                    {plugin.skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <span className="text-sm font-medium">{skill.name}</span>
                        <div className="flex gap-2">
                          {skill.hasSkillMd && (
                            <Badge variant="outline" className="text-xs">
                              SKILL.md
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills found</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
