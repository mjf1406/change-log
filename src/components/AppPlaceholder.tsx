import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAppBySlug } from "@/lib/apps";

type AppPlaceholderProps = {
  slug: string;
};

export function AppPlaceholder({ slug }: AppPlaceholderProps) {
  const app = getAppBySlug(slug);

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>App not found</CardTitle>
            <CardDescription>
              No app matches the route &ldquo;{slug}&rdquo;.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft data-icon="inline-start" />
                Back to hub
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{app.name}</CardTitle>
          <CardDescription>{app.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This app is coming soon. Check back for updates.
          </p>
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft data-icon="inline-start" />
              Back to hub
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
