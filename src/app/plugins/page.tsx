"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatSize } from "@/lib/format";

interface Skill {
  name: string;
  hasSkillMd: boolean;
  skillMdContent?: string;
}

interface Plugin {
  name: string;
  hasConfig: boolean;
  skillCount: number;
  skills: Skill[];
  description?: string;
  version?: string;
  readmeContent?: string;
  fileCount?: number;
  totalSize?: number;
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

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
      <div className="grid gap-4 md:grid-cols-3">
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatSize(plugins.reduce((sum, p) => sum + (p.totalSize ?? 0), 0))}
            </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{plugin.name}</CardTitle>
                    {plugin.version && (
                      <Badge variant="outline" className="text-xs">v{plugin.version}</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {plugin.hasConfig && (
                      <Badge variant="outline">Configured</Badge>
                    )}
                    <Badge variant="secondary">
                      {plugin.skillCount} skill{plugin.skillCount !== 1 ? "s" : ""}
                    </Badge>
                    {plugin.fileCount != null && (
                      <span className="text-xs text-muted-foreground">
                        {plugin.fileCount} files, {formatSize(plugin.totalSize ?? 0)}
                      </span>
                    )}
                  </div>
                </div>
                {plugin.description && (
                  <p className="text-sm text-muted-foreground">{plugin.description}</p>
                )}
              </CardHeader>
              <CardContent>
                {/* Skills */}
                {plugin.skills.length > 0 ? (
                  <div className="space-y-2">
                    {plugin.skills.map((skill) => (
                      <div key={skill.name} className="rounded-md border">
                        <button
                          className="flex items-center justify-between w-full p-3 text-left"
                          onClick={() => setExpandedSkill(
                            expandedSkill === `${plugin.name}/${skill.name}` ? null : `${plugin.name}/${skill.name}`
                          )}
                        >
                          <span className="text-sm font-medium">{skill.name}</span>
                          <div className="flex gap-2 items-center">
                            {skill.hasSkillMd && (
                              <Badge variant="outline" className="text-xs">SKILL.md</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {expandedSkill === `${plugin.name}/${skill.name}` ? "Hide" : "Show"}
                            </span>
                          </div>
                        </button>
                        {expandedSkill === `${plugin.name}/${skill.name}` && skill.skillMdContent && (
                          <div className="px-3 pb-3 border-t">
                            <ScrollArea className="max-h-48">
                              <pre className="text-xs whitespace-pre-wrap mt-2">{skill.skillMdContent}</pre>
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills found</p>
                )}

                {/* README */}
                {plugin.readmeContent && (
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedPlugin(
                        expandedPlugin === plugin.name ? null : plugin.name
                      )}
                    >
                      {expandedPlugin === plugin.name ? "Hide README" : "Show README"}
                    </Button>
                    {expandedPlugin === plugin.name && (
                      <ScrollArea className="max-h-64 mt-2">
                        <div className="text-sm prose prose-sm max-w-none dark:prose-invert bg-muted p-3 rounded">
                          <pre className="whitespace-pre-wrap text-xs">{plugin.readmeContent}</pre>
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
