import { useQuery } from "@tanstack/react-query";
import { widgetApi, widgetConfigured } from "../api/widget.api";

export function useWidgetSettings() {
  return useQuery({
    queryKey: ["widget-settings"],
    queryFn: widgetApi.config,
    enabled: widgetConfigured,
  });
}
