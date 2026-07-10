import { useEffect, useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const googleClientName = import.meta.env.VITE_GOOGLE_CLIENT_NAME;

function UnauthorizedCard() {
  return (
    <Card
      role="alert"
      className="border-destructive/20 bg-destructive/5 text-left shadow-sm ring-destructive/20"
    >
      <CardHeader className="border-b border-destructive/10 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <ShieldAlert className="size-4" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-destructive">401 Unauthorized</CardTitle>
            <CardDescription className="text-destructive/80">
              Access denied
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm leading-relaxed text-foreground">
          You are not an authorized user and never will be. You{" "}
          <em className="font-medium not-italic text-foreground">can</em> view
          everything on the site, however.
        </p>
      </CardContent>
    </Card>
  );
}

type SignInDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const [nonce] = useState(() => crypto.randomUUID());
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowUnauthorized(false);
      setIsSigningIn(false);
    }
  }, [open]);

  const missingConfig = !googleClientId || !googleClientName;

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-sm">
        <CredenzaHeader>
          <CredenzaTitle>Sign in</CredenzaTitle>
          <CredenzaDescription>
            Sign in with your Google account.
          </CredenzaDescription>
        </CredenzaHeader>

        {missingConfig ? (
          <p className="text-destructive text-sm">
            Missing VITE_GOOGLE_CLIENT_ID or VITE_GOOGLE_CLIENT_NAME in .env
          </p>
        ) : (
          <div className="space-y-4">
            {showUnauthorized ? <UnauthorizedCard /> : null}

            <div className="flex justify-center">
              <GoogleOAuthProvider clientId={googleClientId}>
                <GoogleLogin
                  nonce={nonce}
                  onError={() => setShowUnauthorized(true)}
                  onSuccess={({ credential }) => {
                    if (!credential) {
                      setShowUnauthorized(true);
                      return;
                    }

                    setShowUnauthorized(false);
                    setIsSigningIn(true);

                    db.auth
                      .signInWithIdToken({
                        clientName: googleClientName,
                        idToken: credential,
                        nonce,
                      })
                      .then(() => {
                        onOpenChange(false);
                      })
                      .catch(() => {
                        setShowUnauthorized(true);
                      })
                      .finally(() => {
                        setIsSigningIn(false);
                      });
                  }}
                />
              </GoogleOAuthProvider>
            </div>

            {isSigningIn ? (
              <p className="text-center text-xs text-muted-foreground">
                Signing in...
              </p>
            ) : null}
          </div>
        )}
      </CredenzaContent>
    </Credenza>
  );
}
