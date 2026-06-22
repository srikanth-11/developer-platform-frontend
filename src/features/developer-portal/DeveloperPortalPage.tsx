import { useState } from 'react';
import { BookOpen, Check, Copy, Download, ExternalLink, FileJson } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/lib/api';
import { env } from '@/lib/env';
import { getPostmanCollection } from './api';
import { usePortalIndex, useSdkInfo } from './hooks';

/** Default server paths, used if the index call hasn't resolved. */
const DEFAULTS = {
  interactiveDocs: '/docs',
  openApiSpec: '/docs-json',
};

const fullUrl = (path: string) => `${env.apiOrigin}${path}`;

export function DeveloperPortalPage() {
  const index = usePortalIndex();
  const sdk = useSdkInfo();
  const [downloading, setDownloading] = useState(false);

  const docsUrl = fullUrl(index.data?.resources.interactiveDocs ?? DEFAULTS.interactiveDocs);
  const specUrl = fullUrl(index.data?.resources.openApiSpec ?? DEFAULTS.openApiSpec);

  async function downloadPostman() {
    setDownloading(true);
    try {
      const collection = await getPostmanCollection();
      const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'developer-platform.postman_collection.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Postman collection downloaded');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not download collection'));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Developer Portal</h1>
        <p className="text-muted-foreground">
          {index.data?.name ?? 'API docs, the OpenAPI spec, Postman, and client SDKs.'}
        </p>
      </div>

      {/* Resources */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ResourceCard
          icon={<BookOpen className="size-5 text-muted-foreground" />}
          title="Interactive API docs"
          description="Swagger UI — explore and try every endpoint."
        >
          <Button variant="outline" size="sm" onClick={() => window.open(docsUrl, '_blank')}>
            <ExternalLink className="size-4" /> Open docs
          </Button>
        </ResourceCard>

        <ResourceCard
          icon={<FileJson className="size-5 text-muted-foreground" />}
          title="OpenAPI spec"
          description="The raw OpenAPI 3 document (/docs-json)."
        >
          <Button variant="outline" size="sm" onClick={() => window.open(specUrl, '_blank')}>
            <ExternalLink className="size-4" /> View spec
          </Button>
        </ResourceCard>

        <ResourceCard
          icon={<Download className="size-5 text-muted-foreground" />}
          title="Postman collection"
          description="Import into Postman to start calling the API."
        >
          <Button variant="outline" size="sm" onClick={downloadPostman} disabled={downloading}>
            <Download className="size-4" /> {downloading ? 'Preparing…' : 'Download'}
          </Button>
        </ResourceCard>
      </div>

      {/* SDK generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client SDKs</CardTitle>
          <CardDescription>
            {sdk.data?.message ?? 'Generate a typed client from the OpenAPI spec.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sdk.isLoading && <Skeleton className="h-32 w-full" />}
          {sdk.isError && (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(sdk.error, 'Could not load SDK info')}
            </p>
          )}
          {sdk.data?.examples.map((ex) => (
            <div key={ex.language} className="space-y-1">
              <p className="text-sm font-medium">{ex.language}</p>
              <CommandBlock command={ex.command} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ResourceCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        {icon}
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">{children}</CardContent>
    </Card>
  );
}

function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success('Command copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  }
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
      <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">{command}</code>
      <Button variant="ghost" size="icon-sm" onClick={copy}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </Button>
    </div>
  );
}
