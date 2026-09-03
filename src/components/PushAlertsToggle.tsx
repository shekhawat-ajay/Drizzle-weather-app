import { Bell, BellOff } from "lucide-react";
import usePushAlerts from "@/hooks/usePushAlerts";
import { useContext } from "react";
import { LocationContext } from "@/context/LocationContext";
import type { ResultType } from "@/schema/location";

export default function PushAlertsToggle() {
  const { location } = useContext(LocationContext) as unknown as { location: ResultType };
  const { enabled, permission, toggle } = usePushAlerts(location.latitude, location.longitude, location.timezone);

  const label = !("Notification" in window) ? "Not supported" : permission === "denied" ? "Blocked" : enabled ? "Alerts on" : "Enable alerts";

  return (
    <button
      onClick={toggle}
      disabled={!("Notification" in window) || permission === "denied"}
      title={permission === "denied" ? "Notifications blocked — allow in browser settings" : enabled ? "Disable push alerts for severe weather, ISS and meteors" : "Enable push alerts for severe weather, ISS and meteors"}
      className={`btn btn-sm ${enabled ? "btn-primary" : "btn-ghost"}`}
      aria-pressed={enabled}
    >
      {enabled ? <Bell size={14} /> : <BellOff size={14} />}
      {label}
    </button>
  );
}
