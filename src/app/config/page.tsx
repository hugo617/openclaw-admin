"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type ConfigData = Record<string, unknown>;

function JsonHighlight({ content }: { content: string }) {
  const highlighted = useMemo(() => {
    try {
      const formatted = JSON.stringify(JSON.parse(content), null, 2);
      return formatted
        .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span style="color: hsl(221, 83%, 53%)">$1</span>:')
        .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color: hsl(142, 71%, 45%)">$1</span>')
        .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color: hsl(38, 92%, 50%)">$1</span>')
        .replace(/:\s*(true|false)/g, ': <span style="color: hsl(0, 84%, 60%)">$1</span>')
        .replace(/:\s*(null)/g, ': <span style="color: hsl(0, 0%, 50%)">$1</span>');
    } catch {
      return null;
    }
  }, [content]);

  if (highlighted === null) {
    return <pre className="text-sm font-mono whitespace-pre-wrap">{content}</pre>;
  }
  return (
    <pre
      className="text-sm font-mono whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

interface SectionEditorProps {
  title: string;
  data: unknown;
  onSave: (data: unknown) => void;
}

function SectionEditor({ title, data, onSave }: SectionEditorProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const contentStr = useMemo(
    () => JSON.stringify(data, null, 2),
    [data]
  );

  function startEditing() {
    setEditContent(contentStr);
    setEditing(true);
    setError(null);
  }

  function save() {
    try {
      const parsed = JSON.parse(editContent);
      onSave(parsed);
      setEditing(false);
      setError(null);
    } catch {
      setError("Invalid JSON format");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEditing}>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={save}>Save</Button>
          </div>
        )}
      </div>
      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm p-2">
          {error}
        </div>
      )}
      <ScrollArea className="max-h-[400px]">
        {editing ? (
          <textarea
            className="w-full min-h-[300px] font-mono text-sm bg-muted/50 rounded-md p-3 border-0 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        ) : (
          <JsonHighlight content={contentStr} />
        )}
      </ScrollArea>
    </div>
  );
}

const CONFIG_SECTIONS = [
  { key: "model", label: "Model" },
  { key: "auth", label: "Auth" },
  { key: "agents", label: "Agents" },
  { key: "channels", label: "Channels" },
  { key: "tools", label: "Tools" },
  { key: "messages", label: "Messages" },
  { key: "commands", label: "Commands" },
  { key: "session", label: "Session" },
  { key: "hooks", label: "Hooks" },
  { key: "gateway", label: "Gateway" },
  { key: "plugins", label: "Plugins" },
];

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawEdit, setRawEdit] = useState(false);
  const [rawContent, setRawContent] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setConfig(res.data);
        else setError(res.error);
      })
      .catch(() => setError("Failed to load config"))
      .finally(() => setLoading(false));
  }, []);

  async function saveFullConfig(newConfig: ConfigData) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(newConfig);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to save config");
    } finally {
      setSaving(false);
    }
  }

  async function saveSection(key: string, value: unknown) {
    if (!config) return;
    const newConfig = { ...config, [key]: value };
    await saveFullConfig(newConfig);
  }

  async function saveRaw() {
    try {
      const parsed = JSON.parse(rawContent);
      await saveFullConfig(parsed);
      setRawEdit(false);
    } catch {
      setError("Invalid JSON format");
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-96 bg-muted rounded" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6 text-destructive">
          {error || "Config not found"}
        </CardContent>
      </Card>
    );
  }

  const configStr = JSON.stringify(config, null, 2);
  const model = (config.model as string) || (config.defaultModel as string) || "unknown";
  const channels = config.channels as Record<string, unknown> | undefined;
  const channelNames = channels ? Object.keys(channels) : [];

  return (
    <div className="space-y-6">
      {/* Config Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{model}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {channelNames.length > 0 ? (
                channelNames.map((ch) => (
                  <Badge key={ch} variant="secondary">{ch}</Badge>
                ))
              ) : (
                <span className="text-muted-foreground">None configured</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">File Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{configStr.length.toLocaleString()} chars</div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
          {error}
        </div>
      )}

      {/* Tabs */}
      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue="sections">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="sections">Sections</TabsTrigger>
                <TabsTrigger value="raw">Raw JSON</TabsTrigger>
              </TabsList>
              {rawEdit && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRawEdit(false)}>Cancel</Button>
                  <Button size="sm" onClick={saveRaw} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
              {!rawEdit && (
                <Button variant="outline" size="sm" onClick={() => { setRawContent(configStr); setRawEdit(true); }}>
                  Edit Raw JSON
                </Button>
              )}
            </div>

            <TabsContent value="sections">
              <ScrollArea className="max-h-[calc(100vh-380px)]">
                <div className="space-y-4">
                  {CONFIG_SECTIONS.map((section) => {
                    const data = config[section.key];
                    if (data === undefined) return null;
                    return (
                      <div key={section.key} className="border rounded-lg p-4">
                        <SectionEditor
                          title={section.label}
                          data={data}
                          onSave={(value) => saveSection(section.key, value)}
                        />
                      </div>
                    );
                  })}
                  {/* Show any keys not in CONFIG_SECTIONS */}
                  {Object.keys(config)
                    .filter((key) => !CONFIG_SECTIONS.some((s) => s.key === key))
                    .map((key) => (
                      <div key={key} className="border rounded-lg p-4">
                        <SectionEditor
                          title={key}
                          data={config[key]}
                          onSave={(value) => saveSection(key, value)}
                        />
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="raw">
              {rawEdit ? (
                <textarea
                  className="w-full min-h-[500px] font-mono text-sm bg-muted/50 rounded-md p-4 border-0 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                />
              ) : (
                <ScrollArea className="h-[calc(100vh-380px)]">
                  <JsonHighlight content={configStr} />
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
