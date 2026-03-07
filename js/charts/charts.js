let incomeExpenseChart = null;
let categoryChart = null;

function createIncomeExpenseChart(income, expenses) {

  const ctx = document.getElementById("incomeExpenseChart").getContext("2d");

  if (incomeExpenseChart) {
    incomeExpenseChart.destroy();
  }

  incomeExpenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Income", "Expenses"],
      datasets: [{
        label: "Amount",
        data: [income, expenses],
        backgroundColor: ["#99c3a9", "#c97272"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false }
      }
    }
  });
}


function createCategoryChart(categoryTotals) {

  const ctx = document.getElementById("categoryChart").getContext("2d");

  if (categoryChart) {
    categoryChart.destroy();
  }

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  categoryChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          "#c97272",
          "#7da5e6",
          "#78c695",
          "#e0ba79",
          "#ad8bce",
          "#89dcd2"
        ]
      }]
    },
    options: {
      responsive: true
    }
  });
}


function generateInsight(categoryTotals) {

  const insightText = document.getElementById("insightText");

  let highestCategory = null;
  let highestValue = 0;

  for (const category in categoryTotals) {
    if (categoryTotals[category] > highestValue) {
      highestValue = categoryTotals[category];
      highestCategory = category;
    }
  }

  if (highestCategory) {
    insightText.textContent =
      `Most of your spending is on ${highestCategory}. Consider reviewing this category.`;
  }
}

export {
  createIncomeExpenseChart,
  createCategoryChart,
  generateInsight
};

let monthlyChart = null;
let yearlyChart = null;

export function createMonthlyTrendChart(monthlyTotals) {

  const ctx = document
    .getElementById("monthlyTrendChart")
    .getContext("2d");

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: Object.keys(monthlyTotals),
      datasets: [{
        label: "Monthly Spending",
        data: Object.values(monthlyTotals),
        borderColor: "#000",
        backgroundColor: "rgba(0,0,0,0.1)",
        tension: 0.3,
        fill: true
      }]
    }
  });
}

export function createYearlyTrendChart(yearlyTotals) {

  const ctx = document
    .getElementById("yearlyTrendChart")
    .getContext("2d");

  if (yearlyChart) yearlyChart.destroy();

  yearlyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(yearlyTotals),
      datasets: [{
        label: "Yearly Spending",
        data: Object.values(yearlyTotals),
        backgroundColor: "#000"
      }]
    }
  });
}