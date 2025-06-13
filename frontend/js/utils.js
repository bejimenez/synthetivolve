// synthetivolve/frontend/js/utils.js

export function formatDate(date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD format
}

export function calculateDaysRemaining(endDate) {
  const diffTime = new Date(endDate) - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateGoalProgress(startDate, endDate) {
  const totalDuration = new Date(endDate) - new Date(startDate);
  const elapsed = new Date() - new Date(startDate);
  return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
}
