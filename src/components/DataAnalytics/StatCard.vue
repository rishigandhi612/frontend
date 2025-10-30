<template>
  <v-card
    :color="color"
    :dark="dark"
    :outlined="outlined"
    elevation="2"
    class="stat-card"
  >
    <v-card-text>
      <div class="d-flex align-center">
        <div class="flex-grow-1">
          <div
            class="text-caption text--secondary mb-1"
            :class="{ 'white--text': dark }"
          >
            {{ title }}
          </div>
          <div class="text-h5 font-weight-bold" :class="valueClass">
            {{ formattedValue }}
          </div>
          <div
            v-if="subtitle"
            class="text-caption mt-1"
            :class="{ 'white--text': dark }"
          >
            {{ subtitle }}
          </div>

          <!-- Trend Indicator -->
          <div v-if="trend !== null" class="mt-2 d-flex align-center">
            <v-icon small :color="trendColor" class="mr-1">
              {{ trendIcon }}
            </v-icon>
            <span
              class="text-caption font-weight-medium"
              :class="`${trendColor}--text`"
            >
              {{ formattedTrend }}
            </span>
          </div>
        </div>

        <!-- Icon -->
        <div v-if="icon" class="ml-3">
          <v-avatar :color="iconBgColor" size="56">
            <v-icon :color="iconColor" large>{{ icon }}</v-icon>
          </v-avatar>
        </div>
      </div>

      <!-- Progress Bar -->
      <v-progress-linear
        v-if="showProgress"
        :value="progressValue"
        :color="progressColor"
        class="mt-3"
        rounded
        height="6"
      ></v-progress-linear>
    </v-card-text>
  </v-card>
</template>

<script>
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  getTrendIcon,
  getTrendColor,
} from "@/utils/analyticsUtils";

export default {
  name: "StatCard",
  props: {
    title: {
      type: String,
      required: true,
    },
    value: {
      type: [Number, String],
      required: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "",
    },
    dark: {
      type: Boolean,
      default: false,
    },
    outlined: {
      type: Boolean,
      default: false,
    },
    valueType: {
      type: String,
      default: "number", // number, currency, percentage
      validator: (value) =>
        ["number", "currency", "percentage"].includes(value),
    },
    decimals: {
      type: Number,
      default: 2,
    },
    trend: {
      type: Number,
      default: null,
    },
    showProgress: {
      type: Boolean,
      default: false,
    },
    progressValue: {
      type: Number,
      default: 0,
    },
    progressColor: {
      type: String,
      default: "primary",
    },
  },
  computed: {
    formattedValue() {
      if (this.valueType === "currency") {
        return formatCurrency(this.value, this.decimals);
      } else if (this.valueType === "percentage") {
        return formatPercentage(this.value, this.decimals);
      }
      return formatNumber(this.value, this.decimals);
    },
    valueClass() {
      if (this.dark) return "white--text";
      if (this.color) return "";
      return "primary--text";
    },
    formattedTrend() {
      if (this.trend === null) return "";
      const sign = this.trend > 0 ? "+" : "";
      return `${sign}${formatNumber(this.trend, 1)}%`;
    },
    trendIcon() {
      return getTrendIcon(this.trend);
    },
    trendColor() {
      return getTrendColor(this.trend);
    },
    iconBgColor() {
      if (this.dark) return "rgba(255,255,255,0.1)";
      return this.color ? `${this.color} lighten-4` : "grey lighten-4";
    },
    iconColor() {
      if (this.dark) return "white";
      return this.color || "primary";
    },
  },
};
</script>

<style scoped>
.stat-card {
  height: 100%;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}
</style>
