<template>
  <q-page padding class="bg-app">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <DashboardHeader
          @refresh="refreshData"
          @logout="handleLogout"
          @open-export="showExportDialog = true"
          @download-inventory="downloadInventoryReport"
        />
      </div>

      <div class="col-12 col-md-3">
        <MetricCard
          title="Today's Sales"
          :value="formatCurrency(todaySales)"
          icon="payments"
          gradient-class="bg-gradient-primary"
          text-color="blue-1"
        >
          <template #sub-content>
            <q-icon :name="salesComparison >= 0 ? 'trending_up' : 'trending_down'" />
            {{ salesComparison }}% vs yesterday
          </template>
        </MetricCard>
      </div>

      <div class="col-12 col-md-3">
        <MetricCard
          title="Orders Today"
          :value="todayOrders"
          icon="shopping_bag"
          gradient-class="bg-gradient-success"
          text-color="green-1"
          :sub-label="`Avg. ${formatCurrency(averageOrderValue)} per order`"
        />
      </div>

      <div class="col-12 col-md-3">
        <MetricCard
          title="Low Stock Items"
          :value="lowStockItems"
          icon="inventory_2"
          gradient-class="bg-gradient-warning"
          text-color="orange-1"
          :sub-label="`${criticalStockItems} items critical`"
        />
      </div>

      <div class="col-12 col-md-3">
        <MetricCard
          title="Active Tables"
          :value="activeTables"
          icon="table_restaurant"
          gradient-class="bg-gradient-info"
          text-color="cyan-1"
          :sub-label="`${occupiedTables} of ${totalTables} occupied`"
        />
      </div>

      <div class="col-12 col-md-8">
        <SalesChart :orders="orderStore.orders" />
      </div>

      <div class="col-12 col-md-4">
        <RecentOrders :orders="recentOrders" />
      </div>
    </div>

    <ExportDialog v-model="showExportDialog" @export="executeExportCSV" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import { auth } from 'src/services/firebase'
import { useOrderStore } from 'src/stores/orderStore'
import { useProductStore } from 'src/stores/productStore'
import { useFormatters } from 'src/composables/useFormatters'

// Components
import DashboardHeader from 'src/components/dashboard/DashboardHeader.vue'
import MetricCard from 'src/components/dashboard/MetricCard.vue'
import SalesChart from 'src/components/dashboard/SalesChart.vue'
import RecentOrders from 'src/components/dashboard/RecentOrders.vue'
import ExportDialog from 'src/components/dashboard/ExportDialog.vue'

// Logic
const router = useRouter()
const orderStore = useOrderStore()
const productStore = useProductStore()
const { formatCurrency } = useFormatters()

const showExportDialog = ref(false)
const activeTables = ref(0)
const occupiedTables = ref(0)
const totalTables = ref(0)

// Computed Stats
const todayOrders = computed(() => {
  // Simple filter for "today"
  const now = new Date()
  return orderStore.orders.filter((o) => {
    const d = o.createdAt?.toDate() || new Date(o.date)
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth()
  }).length
})

const todaySales = computed(() => {
  const now = new Date()
  return orderStore.orders
    .filter((o) => {
      const d = o.createdAt?.toDate() || new Date(o.date)
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, o) => sum + Number(o.total || o.totalAmount || 0), 0)
})

const averageOrderValue = computed(() =>
  todayOrders.value > 0 ? todaySales.value / todayOrders.value : 0,
)

const lowStockItems = computed(
  () => productStore.products.filter((p) => (p.stock ?? 0) <= 5).length,
)
const criticalStockItems = computed(
  () => productStore.products.filter((p) => (p.stock ?? 0) <= 2).length,
)

// Sales Comparison Logic (Simplified for brevity)
const salesComparison = ref(12.5) // You can calculate this by comparing today vs yesterday sums

const recentOrders = computed(() => {
  return [...orderStore.orders]
    .sort(
      (a, b) =>
        (b.createdAt?.toDate() || new Date(b.date)) - (a.createdAt?.toDate() || new Date(a.date)),
    )
    .slice(0, 5)
})

const showExportDialog = ref(false)
const exportDateRange = ref({ from: '2024-01-01', to: '2024-01-07' })
const exportFormat = ref('csv')
const includeDetails = ref(true)
const includeInventory = ref(false)
const includeAnalytics = ref(true)
const formatOptions = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel', value: 'excel' },
  { label: 'PDF', value: 'pdf' },
]

const chartData = ref([])
const previousPeriodData = ref([])

const timeGreeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 18) return 'Afternoon'
  return 'Evening'
})

const salesComparison = computed(() => {
  const len = chartData.value.length
  if (len < 2) return 0
  const last = chartData.value[len - 1]?.amount || 0
  const prev = chartData.value[len - 2]?.amount || 0
  const change = prev > 0 ? ((last - prev) / prev) * 100 : 0
  return Math.round(change * 10) / 10
})

const averageOrderValue = computed(() => {
  return todayOrders.value > 0 ? todaySales.value / todayOrders.value : 0
})

const periodStats = computed(() => {
  const totalSales = chartData.value.reduce((sum, item) => sum + item.amount, 0)
  const totalOrders = chartData.value.reduce((sum, item) => sum + item.orders, 0)
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
  const prevTotalSales = previousPeriodData.value.reduce((sum, item) => sum + item.amount, 0)
  const growth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0

  return {
    totalSales,
    totalOrders,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    growth: Math.round(growth * 10) / 10,
  }
})

const yAxisLabels = computed(() => {
  if (chartData.value.length === 0) return []

  const maxAmount = Math.max(...chartData.value.map((d) => d.amount), 100)
  const minAmount = 0

  const range = maxAmount - minAmount
  const step = range / 4

  return [
    Math.ceil(maxAmount),
    Math.ceil(maxAmount - step),
    Math.ceil(maxAmount - step * 2),
    Math.ceil(maxAmount - step * 3),
    0,
  ]
})

const lineChartPoints = computed(() => {
  if (chartData.value.length === 0) return []

  const maxAmount = Math.max(...chartData.value.map((d) => d.amount), 10)
  const minAmount = 0
  const range = maxAmount - minAmount

  const containerWidth = 100
  const pointSpacing = containerWidth / (chartData.value.length - 1 || 1)

  return chartData.value.map((item, index) => {
    const x = index * pointSpacing
    const y = 100 - ((item.amount - minAmount) / range) * 100
    return { x: `${x}%`, y: `${y}%` }
  })
})

const changePeriod = (period) => {
  selectedPeriod.value = period
  loadChartData()
}

const getDateFromOrder = (o) => {
  if (o.createdAt && typeof o.createdAt.toDate === 'function') {
    return o.createdAt.toDate()
  } else if (o.date) {
    return new Date(o.date)
  }
  return new Date()
}

const loadChartData = () => {
  const period = timePeriods.value.find((p) => p.value === selectedPeriod.value.value)
  const orders = orderStore.orders || []

  if (period.type === 'daily') {
    chartData.value = buildDailyData(orders, period.days, 0)
    previousPeriodData.value = buildDailyData(orders, period.days, period.days)
  } else if (period.type === 'monthly') {
    chartData.value = buildMonthlyData(orders, period.months)
    previousPeriodData.value = []
  } else if (period.type === 'yearly') {
    chartData.value = buildYearlyData(orders, period.years)
    previousPeriodData.value = []
  }
}

const buildDailyData = (orders, days, offsetDays) => {
  const data = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(today)
  start.setDate(today.getDate() - (days + offsetDays - 1))

  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const label = days <= 7
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : `${d.getMonth() + 1}/${d.getDate()}`
    data.push({ date: d, label, amount: 0, orders: 0, sortKey: d.getTime() })
  }

  orders.forEach((o) => {
    const orderDate = getDateFromOrder(o)
    const diffTime = orderDate - start
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays >= 0 && diffDays < days) {
      data[diffDays].amount += Number(o.total || o.totalAmount || 0)
      data[diffDays].orders += 1
    }
  })

  return data.map((x) => ({ ...x, amount: Math.round(x.amount * 100) / 100 }))
}

const buildMonthlyData = (orders, months) => {
    const data = []
    const today = new Date()

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const monthLabel = d.toLocaleString('default', { month: 'short' })
        const key = `${d.getFullYear()}-${d.getMonth()}`

        data.push({
            label: monthLabel,
            key: key,
            amount: 0,
            orders: 0
        })
    }

    orders.forEach(o => {
        const date = getDateFromOrder(o)
        const key = `${date.getFullYear()}-${date.getMonth()}`
        const bucket = data.find(b => b.key === key)
        if (bucket) {
            bucket.amount += Number(o.total || o.totalAmount || 0)
            bucket.orders += 1
        }
    })

    return data.map((x) => ({ ...x, amount: Math.round(x.amount * 100) / 100 }))
}

const buildYearlyData = (orders, years) => {
    const data = []
    const currentYear = new Date().getFullYear()

    for (let i = years - 1; i >= 0; i--) {
        const year = currentYear - i
        data.push({
            label: year.toString(),
            key: year,
            amount: 0,
            orders: 0
        })
    }

    orders.forEach(o => {
        const date = getDateFromOrder(o)
        const year = date.getFullYear()
        const bucket = data.find(b => b.key === year)
        if (bucket) {
            bucket.amount += Number(o.total || o.totalAmount || 0)
            bucket.orders += 1
        }
    })

    return data.map((x) => ({ ...x, amount: Math.round(x.amount * 100) / 100 }))
}

const getChartBarHeight = (amount) => {
  if (chartData.value.length === 0) return 0
  const maxAmount = Math.max(...chartData.value.map((d) => d.amount), 1)
  return Math.max((amount / maxAmount) * 80, 5)
}

const getLinePath = () => {
  if (lineChartPoints.value.length === 0) return ''
  const points = lineChartPoints.value
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`
  }
  return path
}

const getAreaPath = () => {
  if (lineChartPoints.value.length === 0) return ''
  const points = lineChartPoints.value
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`
  }
  path += ` L ${points[points.length - 1].x} 100`
  path += ` L ${points[0].x} 100`
  path += ' Z'
  return path
}

const isLastBar = (index) => {
  return index === chartData.value.length - 1
}

const formatCurrency = (amount, compact = false) => {
  if (isNaN(amount)) return '₱0.00'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: 2,
    notation: compact ? 'compact' : 'standard'
  }).format(amount)
}

const formatTime = (dateInput) => {
  if (!dateInput) return ''
  const date =
    dateInput && typeof dateInput.toDate === 'function' ? dateInput.toDate() : new Date(dateInput)

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getOrderStatusColor = (status) => {
  const colors = {
    Completed: 'positive',
    Preparing: 'warning',
    Pending: 'info',
    Cancelled: 'negative',
  }
  return colors[status] || 'grey'
}

const orderTotal = (order) => {
  const t = order.totalAmount ?? order.total
  if (typeof t === 'number') return t
  const items = Array.isArray(order.items) ? order.items : []
  const subtotal = items.reduce((s, i) => s + Number(i.unitPrice ?? i.price ?? i.productPrice ?? 0) * Number(i.quantity ?? 1), 0)
  const tax = Number(order.taxAmount ?? 0)
  const discount = Number(order.discountAmount ?? 0)
  return subtotal + tax - discount
}

const refreshData = async () => {
  await orderStore.fetchOrders()
  loadChartData()
}

const handleLogout = async () => {
  await signOut(auth)
  router.push('/login')
}

const executeExportCSV = (options) => {
  console.log('Exporting with options:', options)
  showExportDialog.value = false
}
const downloadInventoryReport = () => {
  console.log('Downloading inventory...')
}

onMounted(async () => {
  await Promise.all([orderStore.fetchOrders(), productStore.fetchProducts()])

  const orders = orderStore.orders || []
  todayOrders.value = orders.length
  todaySales.value = orders.reduce((s, o) => s + Number(o.total || o.totalAmount || 0), 0)
  lowStockItems.value = productStore.products.filter((p) => (p.stock ?? 0) <= 5).length

  loadChartData()
})
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.metric-card {
  overflow: hidden;
  position: relative;
}

.metric-card .q-card__section {
    position: relative;
    z-index: 2;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
}

.bg-gradient-success {
  background: linear-gradient(135deg, #26a69a 0%, #00695c 100%);
}

.bg-gradient-warning {
  background: linear-gradient(135deg, #f2c037 0%, #e65100 100%);
}

.bg-gradient-info {
  background: linear-gradient(135deg, #26c6da 0%, #0097a7 100%);
}

.opacity-50 {
  opacity: 0.5;
}

.gradient-text {
  background: linear-gradient(45deg, #1976d2, #26a69a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.rounded-borders {
  border-radius: 12px;
}

.chart-bar {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-bar:hover {
  opacity: 0.8;
  transform: scaleY(1.02);
}

.chart-path {
  animation: draw 1.5s ease-out forwards;
}

.chart-area {
  animation: fadeIn 1.5s ease-out forwards;
}

@keyframes draw {
  from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
