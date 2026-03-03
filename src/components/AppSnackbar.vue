<template>
  <v-snackbar v-model="visible" :color="color" :timeout="timeout" top right>
    {{ message }}
    <template #action>
      <v-btn text @click="hide">Close</v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  name: "AppSnackbar",
  computed: {
    ...mapState("snackbar", ["visible", "message", "color", "timeout"]),
  },
  methods: {
    ...mapActions("snackbar", ["hideSnackbar"]),
    hide() {
      this.hideSnackbar();
    },
  },
  watch: {
    visible(newVal) {
      // ensure hide after timeout if component doesn't automatically do it
      if (newVal && this.timeout) {
        setTimeout(() => {
          this.hideSnackbar();
        }, this.timeout + 100); // small buffer
      }
    },
  },
};
</script>

<style scoped>
/* custom styles if needed */
</style>
