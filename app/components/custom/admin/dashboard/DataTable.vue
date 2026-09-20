<script setup lang="ts">
import type { RowSelectionState } from "@tanstack/vue-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  EllipsisVertical,
  Eye,
  Search,
} from "lucide-vue-next";
import {
  createColumnHelper,
  FlexRender,
  useTable,
} from "@tanstack/vue-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { features } from "./features";
import { ORDER_STATUSES, planBulkStatusChange } from "~~/shared/utils/orderStatus";
import { filterOrderRows } from "~~/shared/utils/orderDisplay";
import { toast } from "vue-sonner";

export interface OrderRow {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  itemCount: number
  total: number
  status: string
  paymentStatus: string
  createdAt: string
}

const props = withDefaults(defineProps<{
  orders: OrderRow[]
  /** Optional heading (e.g. "Needs attention"); empty hides the row. */
  title?: string
  /** Status tabs make sense for archives, not for filtered queues. */
  showTabs?: boolean
  /** The orders page links to itself — it hides this self-link. */
  showViewAll?: boolean
  /** Empty-state copy when no search is active. */
  emptyText?: string
}>(), {
  title: "",
  showTabs: true,
  showViewAll: true,
  emptyText: "No orders yet.",
});

const emit = defineEmits<{
  (e: "orders-changed"): void
}>();

const NuxtLinkComponent = resolveComponent("NuxtLink");

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  confirmed: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  preparing: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  ready: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const PAYMENT_BADGE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  refunded: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

function formatNaira(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type OrderTab = "all" | "pending" | "active" | "completed" | "cancelled";

const ACTIVE_STATUSES = ["confirmed", "preparing", "ready"];

const activeTab = ref<OrderTab>("all");
const searchQuery = ref("");

const tabCounts = computed<Record<OrderTab, number>>(() => ({
  all: props.orders.length,
  pending: props.orders.filter((o) => o.status === "pending").length,
  active: props.orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
  completed: props.orders.filter((o) => o.status === "completed").length,
  cancelled: props.orders.filter((o) => o.status === "cancelled").length,
}));

const visibleOrders = computed(() => {
  let base: OrderRow[];
  switch (activeTab.value) {
    case "pending":
      base = props.orders.filter((o) => o.status === "pending");
      break;
    case "active":
      base = props.orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
      break;
    case "completed":
      base = props.orders.filter((o) => o.status === "completed");
      break;
    case "cancelled":
      base = props.orders.filter((o) => o.status === "cancelled");
      break;
    default:
      base = props.orders;
  }
  return filterOrderRows(base, searchQuery.value);
});

const columnHelper = createColumnHelper<typeof features, OrderRow>();

const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: ({ table }) => h(Checkbox, {
      "modelValue": table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate"),
      "onUpdate:modelValue": (value: boolean | "indeterminate") => table.toggleAllPageRowsSelected(!!value),
      "aria-label": "Select all",
    }),
    cell: ({ row }) => h(Checkbox, {
      "modelValue": row.getIsSelected(),
      "onUpdate:modelValue": (value: boolean | "indeterminate") => row.toggleSelected(!!value),
      "aria-label": "Select row",
    }),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("orderNumber", {
    header: "Order",
    cell: ({ row }) => h("div", { class: "font-mono text-xs font-medium" }, String(row.getValue("orderNumber"))),
    enableHiding: false,
  }),
  columnHelper.accessor("customerName", {
    header: "Customer",
    cell: ({ row }) => h("div", { class: "flex flex-col" }, [
      h("span", { class: "font-medium" }, String(row.getValue("customerName"))),
      h("span", { class: "text-muted-foreground text-xs" }, row.original.customerEmail),
    ]),
  }),
  columnHelper.accessor("itemCount", {
    header: "Items",
    cell: ({ row }) => h("div", { class: "tabular-nums" }, String(row.getValue("itemCount"))),
  }),
  columnHelper.accessor("total", {
    header: () => h("div", { class: "text-right" }, "Total"),
    cell: ({ row }) => h("div", { class: "text-right font-medium tabular-nums" }, formatNaira(Number(row.getValue("total")))),
  }),
  columnHelper.accessor("paymentStatus", {
    header: "Payment",
    cell: ({ row }) => {
      const status = String(row.getValue("paymentStatus"));
      return h(Badge, { variant: "secondary", class: PAYMENT_BADGE[status] ?? "" }, () => status);
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.getValue("status"));
      return h(Badge, { variant: "secondary", class: STATUS_BADGE[status] ?? "" }, () => status);
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Date",
    cell: ({ row }) => h("div", { class: "text-muted-foreground text-xs" }, formatDate(String(row.getValue("createdAt")))),
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => h(DropdownMenu, {}, {
      default: () => [
        h(DropdownMenuTrigger, { asChild: true }, {
          default: () => h(Button, { variant: "ghost", class: "h-8 w-8 p-0" }, {
            default: () => [
              h("span", { class: "sr-only" }, "Open menu"),
              h(EllipsisVertical, { class: "h-4 w-4" }),
            ],
          }),
        }),
        h(DropdownMenuContent, { align: "end" }, {
          default: () => [
            h(DropdownMenuItem, { asChild: true }, {
              default: () => h(NuxtLinkComponent, { to: `/admin/orders/${row.original.id}` }, {
                default: () => [h(Eye, { class: "mr-2 h-4 w-4" }), "View order"],
              }),
            }),
          ],
        }),
      ],
    }),
  }),
]);

const rowSelection = ref<RowSelectionState>({});

const table = useTable({
  features,
  get data() {
    return visibleOrders.value;
  },
  columns,
  state: {
    get rowSelection() { return rowSelection.value; },
  },
  onRowSelectionChange: (updater) => {
    rowSelection.value = typeof updater === "function" ? updater(rowSelection.value) : updater;
  },
});

// Bulk status change: previewed with planBulkStatusChange (illegal moves
// are skipped, never sent), executed as individual audited PUTs so every
// row keeps its own audit trail. Payment state is untouched (key omitted).
const bulkTarget = ref<(typeof ORDER_STATUSES)[number]>("confirmed");
const bulkBusy = ref(false);
const selectedRows = computed<OrderRow[]>(() =>
  table.getSelectedRowModel().rows.map((r) => r.original as OrderRow)
);
const bulkPlan = computed(() =>
  planBulkStatusChange(
    selectedRows.value.map((o) => ({ id: o.id, status: o.status })),
    bulkTarget.value
  )
);

function clearSelection() {
  rowSelection.value = {};
}

async function applyBulkStatus() {
  const { apply, skipped } = bulkPlan.value;
  if (!apply.length) return;
  bulkBusy.value = true;
  let updated = 0;
  let failed = 0;
  try {
    for (const id of apply) {
      try {
        await $fetch(`/api/admin/orders/${id}/status`, {
          method: "PUT",
          body: { status: bulkTarget.value },
        });
        updated += 1;
      } catch {
        failed += 1;
      }
    }
    if (updated) toast.success(`${updated} order${updated === 1 ? "" : "s"} moved to ${bulkTarget.value}.`);
    if (failed) toast.error(`${failed} update${failed === 1 ? "" : "s"} failed — they were left untouched.`);
    if (skipped.length) toast.info(`${skipped.length} selected order${skipped.length === 1 ? "" : "s"} can't move there — skipped.`);
    clearSelection();
    emit("orders-changed");
  } finally {
    bulkBusy.value = false;
  }
}
</script>

<template>
  <Tabs
    v-model="activeTab"
    class="w-full flex-col justify-start gap-6"
  >
    <div v-if="title" class="flex items-end justify-between px-4 lg:px-6">
      <h2 class="text-lg font-semibold">{{ title }} <span class="text-sm font-normal text-muted-foreground">({{ orders.length }})</span></h2>
    </div>
    <div class="flex items-center justify-between px-4 lg:px-6">
      <TabsList v-if="showTabs" class="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
        <TabsTrigger value="all">
          All <Badge variant="secondary">{{ tabCounts.all }}</Badge>
        </TabsTrigger>
        <TabsTrigger value="pending">
          Pending <Badge variant="secondary">{{ tabCounts.pending }}</Badge>
        </TabsTrigger>
        <TabsTrigger value="active">
          In progress <Badge variant="secondary">{{ tabCounts.active }}</Badge>
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed <Badge variant="secondary">{{ tabCounts.completed }}</Badge>
        </TabsTrigger>
        <TabsTrigger value="cancelled">
          Cancelled <Badge variant="secondary">{{ tabCounts.cancelled }}</Badge>
        </TabsTrigger>
      </TabsList>
      <div class="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <Columns3 />
              <span class="hidden lg:inline">Customize Columns</span>
              <span class="lg:hidden">Columns</span>
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <template v-for="column in table.getAllColumns().filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())" :key="column.id">
              <DropdownMenuCheckboxItem
                class="capitalize"
                :model-value="column.getIsVisible()"
                @update:model-value="(value) => column.toggleVisibility(!!value)"
              >
                {{ column.id }}
              </DropdownMenuCheckboxItem>
            </template>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button v-if="showViewAll" variant="outline" size="sm" as-child>
          <NuxtLink to="/admin/orders">
            View all orders
          </NuxtLink>
        </Button>
      </div>
    </div>
    <div class="px-4 lg:px-6">
      <div class="relative">
        <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <label for="admin-order-search" class="sr-only">Search orders</label>
        <Input
          id="admin-order-search"
          v-model="searchQuery"
          placeholder="Search order number, customer, email…"
          class="pl-9"
        />
      </div>
    </div>
    <div
      v-if="selectedRows.length"
      class="mx-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 lg:mx-6"
    >
      <span class="text-sm font-medium">{{ selectedRows.length }} selected</span>
      <label for="admin-bulk-status" class="sr-only">Move selected orders to</label>
      <select id="admin-bulk-status" v-model="bulkTarget" class="rounded border border-border bg-background px-3 py-1.5 text-sm">
        <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
      <Button size="sm" :disabled="!bulkPlan.apply.length || bulkBusy" @click="applyBulkStatus">
        {{ bulkBusy ? "Updating…" : `Move ${bulkPlan.apply.length} to ${bulkTarget}` }}
      </Button>
      <span v-if="bulkPlan.skipped.length" class="text-xs text-muted-foreground">
        {{ bulkPlan.skipped.length }} can't move there — skipped
      </span>
      <button type="button" class="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground hover:underline" @click="clearSelection">
        Clear
      </button>
    </div>
    <div
      class="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
    >
      <div class="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader class="bg-muted sticky top-0 z-10">
            <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <TableHead v-for="header in headerGroup.headers" :key="header.id" :colspan="header.colSpan">
                <FlexRender v-if="!header.isPlaceholder" :header="header" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="table.getRowModel().rows.length">
              <TableRow
                v-for="row in table.getRowModel().rows"
                :key="row.id"
                :data-state="row.getIsSelected() && 'selected'"
              >
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                  <FlexRender :cell="cell" />
                </TableCell>
              </TableRow>
            </template>
            <TableRow v-else>
              <TableCell
                :colspan="columns.length"
                class="h-24 text-center"
              >
                {{ searchQuery ? "No orders match your search." : emptyText }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div class="flex items-center justify-between px-4">
        <div class="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {{ table.getFilteredSelectedRowModel().rows.length }} of
          {{ table.getFilteredRowModel().rows.length }} row(s) selected.
        </div>
        <div class="flex w-full items-center gap-8 lg:w-fit">
          <div class="hidden items-center gap-2 lg:flex">
            <Label for="rows-per-page" class="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              :model-value="`${table.atoms.pagination.get().pageSize}`"
              @update:model-value="(value) => table.setPageSize(Number(value))"
            >
              <SelectTrigger id="rows-per-page" size="sm" class="w-20">
                <SelectValue :placeholder="`${table.atoms.pagination.get().pageSize}`" />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem v-for="pageSize in [10, 20, 30, 40, 50]" :key="pageSize" :value="`${pageSize}`">
                  {{ pageSize }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex w-fit items-center justify-center text-sm font-medium">
            Page {{ table.atoms.pagination.get().pageIndex + 1 }} of
            {{ table.getPageCount() }}
          </div>
          <div class="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              class="hidden h-8 w-8 p-0 lg:flex"
              :disabled="!table.getCanPreviousPage()"
              @click="table.setPageIndex(0)"
            >
              <span class="sr-only">Go to first page</span>
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              class="size-8"
              size="icon"
              :disabled="!table.getCanPreviousPage()"
              @click="table.previousPage()"
            >
              <span class="sr-only">Go to previous page</span>
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              class="size-8"
              size="icon"
              :disabled="!table.getCanNextPage()"
              @click="table.nextPage()"
            >
              <span class="sr-only">Go to next page</span>
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              class="hidden size-8 lg:flex"
              size="icon"
              :disabled="!table.getCanNextPage()"
              @click="table.setPageIndex(table.getPageCount() - 1)"
            >
              <span class="sr-only">Go to last page</span>
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Tabs>
</template>
