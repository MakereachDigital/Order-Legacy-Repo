import { useState } from "react";
import { Bell, BellOff, Smartphone, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function PushNotificationSettings() {
  const { toast } = useToast();
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    isiOS,
    isPWA,
    subscribe,
    unsubscribe
  } = usePushNotifications();
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast({ title: "Notifications disabled" });
      } else {
        await subscribe();
        toast({ title: "Notifications enabled!" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          payload: {
            title: "Test Notification 🔔",
            body: "Push notifications are working!",
            url: "/"
          }
        }
      });

      toast({ title: "Test sent!" });
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSendingTest(false);
    }
  };

  // iOS not in PWA mode - show instructions
  if (isiOS && !isPWA) {
    return (
      <div className="p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="w-5 h-5 text-primary" />
          <span className="font-medium">Push Notifications</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Install the app first:</p>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Tap the Share button in Safari</li>
          <li>Scroll down and tap "Add to Home Screen"</li>
          <li>Open the app from your home screen</li>
        </ol>
      </div>
    );
  }

  // Not supported
  if (!isSupported) {
    return (
      <div className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellOff className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">Push Notifications</span>
        </div>
        <span className="text-sm text-muted-foreground">Not supported in this browser</span>
      </div>
    );
  }

  // Permission denied
  if (permission === 'denied') {
    return (
      <div className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <span className="font-medium">Push Notifications</span>
        </div>
        <span className="text-sm text-muted-foreground">Permission denied - update browser settings</span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <span className="font-medium">Push Notifications</span>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </div>
      
      {isSubscribed && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendTest}
          disabled={isSendingTest}
          className="mt-3 w-full"
        >
          {isSendingTest ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Bell className="w-4 h-4 mr-2" />
          )}
          Send Test Notification
        </Button>
      )}
    </div>
  );
}
