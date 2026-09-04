<script setup lang="ts">
import type { ChartConfig } from "@/components/ui/chart";

import { VisArea, VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartCrosshair,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface RevenuePoint {
  date: string
  revenue: number
}

const props = defineProps<{
  data: RevenuePoint[]
}>();

interface ChartDatum {
  date: Date
  revenue: number
}

const chartConfig = {
  revenue: {
    label: "Revenue (₦)",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const svgDefs = `
  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
    <stop
      offset="5%"
      stop-color="var(--color-revenue)"
      stop-opacity="0.8"
    />
    <stop
      offset="95%"
      stop-color="var(--color-revenue)"
      stop-opacity="0.1"
    />
  </linearGradient>
`;

const timeRange = ref("30d");

const chartData = computed<ChartDatum[]>(() =>
  props.data.map((point) => ({ date: new Date(point.date), revenue: point.revenue })),
);

const filterRange = computed(() => {
  const daysToSubtract = timeRange.value === "7d" ? 7 : timeRange.value === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - daysToSubtract);
  return chartData.value
    .filter((item) => item.date >= startDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
});

const yMax = computed(() => {
  const max = Math.max(0, ...filterRange.value.map((item) => item.revenue));
  return max === 0 ? 100 : Math.ceil(max * 1.2);
});

function formatDay(d: number) {
  return new Date(d).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
  });
}
</script>

<template>
  <Card class="pt-0">
    <CardHeader class="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
      <div class="grid flex-1 gap-1">
        <CardTitle>Revenue</CardTitle>
        <CardDescription>
          Paid orders per day
        </CardDescription>
      </div>
      <Select v-model="timeRange">
        <SelectTrigger
          class="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
          aria-label="Select a value"
        >
          <SelectValue placeholder="Last 30 days" />
        </SelectTrigger>
        <SelectContent class="rounded-xl">
          <SelectItem value="90d" class="rounded-lg">
            Last 3 months
          </SelectItem>
          <SelectItem value="30d" class="rounded-lg">
            Last 30 days
          </SelectItem>
          <SelectItem value="7d" class="rounded-lg">
            Last 7 days
          </SelectItem>
        </SelectContent>
      </Select>
    </CardHeader>
    <CardContent class="px-2 pt-4 sm:px-6 sm:pt-6 pb-4">
      <ChartContainer :config="chartConfig" class="aspect-auto h-[250px] w-full" :cursor="false">
        <VisXYContainer
          :data="filterRange"
          :svg-defs="svgDefs"
          :margin="{ left: -40 }"
          :y-domain="[0, yMax]"
        >
          <VisArea
            :x="(d: ChartDatum) => d.date"
            :y="(d: ChartDatum) => d.revenue"
            color="url(#fillRevenue)"
            :opacity="0.6"
          />
          <VisLine
            :x="(d: ChartDatum) => d.date"
            :y="(d: ChartDatum) => d.revenue"
            :color="chartConfig.revenue.color"
            :line-width="1"
          />
          <VisAxis
            type="x"
            :x="(d: ChartDatum) => d.date"
            :tick-line="false"
            :domain-line="false"
            :grid-line="false"
            :num-ticks="6"
            :tick-format="(d: number) => formatDay(d)"
          />
          <VisAxis
            type="y"
            :num-ticks="3"
            :tick-line="false"
            :domain-line="false"
          />
          <ChartTooltip />
          <ChartCrosshair
            :template="componentToString(chartConfig, ChartTooltipContent, {
              labelFormatter: (d) => formatDay(Number(d)),
            })"
            :color="chartConfig.revenue.color"
          />
        </VisXYContainer>

        <ChartLegendContent />
      </ChartContainer>
    </CardContent>
  </Card>
</template>
