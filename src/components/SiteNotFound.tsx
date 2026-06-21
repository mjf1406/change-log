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

type SiteNotFoundProps = {
  slug: string;
};

export function SiteNotFound({ slug }: SiteNotFoundProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Site not found</CardTitle>
          <CardDescription>
            No site matches &ldquo;{slug}&rdquo;.
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
