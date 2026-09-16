<script setup lang="ts">
import { TrendingDown, TrendingUp } from "lucide-vue-next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface DashboardStats {
  revenue: number
  revenueDeltaPct: number | null
  totalOrders: number
  pendingOrders: number
  activeProducts: number
  totalCustomers: number
}

defineProps<{
  stats: DashboardStats
}>();

function formatNaira(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}
</script>

<template>
  <div class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-5">
    <Card class="@container/card">
      <CardHeader>
        <CardDescription>Total Revenue</CardDescription>
        <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {{ formatNaira(stats.revenue) }}
        </CardTitle>
        <CardAction v-if="stats.revenueDeltaPct !== null">
          <Badge variant="outline">
            <component :is="stats.revenueDeltaPct >= 0 ? TrendingUp : TrendingDown" />
            {{ stats.revenueDeltaPct >= 0 ? "+" : "" }}{{ stats.revenueDeltaPct }}%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter class="flex-col items-start gap-1.5 text-sm">
        <div class="line-clamp-1 flex gap-2 font-medium">
          Paid orders, all time
        </div>
        <div class="text-muted-foreground">
          Excludes pending and failed payments
        </div>
      </CardFooter>
    </Card>
    <Card class="@container/card">
      <CardHeader>
        <CardDescription>Total Orders</CardDescription>
        <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {{ stats.totalOrders.toLocaleString() }}
        </CardTitle>
      </CardHeader>
      <CardFooter class="flex-col items-start gap-1.5 text-sm">
        <div class="line-clamp-1 flex gap-2 font-medium">
          All orders placed
        </div>
        <div class="text-muted-foreground">
          Guests and signed-in customers
        </div>
      </CardFooter>
    </Card>
    <Card class="@container/card">
      <CardHeader>
        <CardDescription>Pending Orders</CardDescription>
        <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {{ stats.pendingOrders.toLocaleString() }}
        </CardTitle>
      </CardHeader>
      <CardFooter class="flex-col items-start gap-1.5 text-sm">
        <div class="line-clamp-1 flex gap-2 font-medium">
          Awaiting confirmation
        </div>
        <div class="text-muted-foreground">
          Needs kitchen attention
        </div>
      </CardFooter>
    </Card>
    <Card class="@container/card">
      <CardHeader>
        <CardDescription>Active Products</CardDescription>
        <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {{ stats.activeProducts.toLocaleString() }}
        </CardTitle>
      </CardHeader>
      <CardFooter class="flex-col items-start gap-1.5 text-sm">
        <div class="line-clamp-1 flex gap-2 font-medium">
          Live on the menu
        </div>
        <div class="text-muted-foreground">
          Visible to customers
        </div>
      </CardFooter>
    </Card>
    <Card class="@container/card">
      <CardHeader>
        <CardDescription>Total Customers</CardDescription>
        <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {{ stats.totalCustomers.toLocaleString() }}
        </CardTitle>
      </CardHeader>
      <CardFooter class="flex-col items-start gap-1.5 text-sm">
        <div class="line-clamp-1 flex gap-2 font-medium">
          Registered accounts
        </div>
        <div class="text-muted-foreground">
          Signed-up customers
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
