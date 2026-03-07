import { db } from "../firebase.js";
import { formatCurrency } from "../utils/format.js";

let modalEditId = null;

import {
  createIncomeExpenseChart,
  createCategoryChart,
  createMonthlyTrendChart,
  createYearlyTrendChart,
  generateInsight
} from "../charts/charts.js";

import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let unsubscribeTransactions = null;
let totalIncome = 0;
let totalExpenses = 0;
let categoryTotals = {};

function loadTransactions(uid, elements, state) {

  const {
    transactionList,
    totalIncomeEl,
    totalExpensesEl,
    remainingBalanceEl
  } = elements;

  const { currentWallet, currentFilter } = state;

  if (unsubscribeTransactions) {
    unsubscribeTransactions();
  }

  let constraints = [
    where("userId", "==", uid),
    orderBy("date", "desc")
  ];

  if (currentWallet) {
    constraints.push(where("wallet", "==", currentWallet));
  }

  const today = new Date();
  let startDate = null;

  if (currentFilter === "week") {
    startDate = new Date();
    startDate.setDate(today.getDate() - 7);
  }

  if (currentFilter === "month") {
    startDate = new Date();
    startDate.setMonth(today.getMonth() - 1);
  }

  if (currentFilter === "year") {
    startDate = new Date();
    startDate.setFullYear(today.getFullYear() - 1);
  }

  if (startDate) {
    constraints.push(
      where("date", ">=", Timestamp.fromDate(startDate))
    );
  }

  const q = query(collection(db, "transactions"), ...constraints);

  unsubscribeTransactions = onSnapshot(q, (snapshot) => {

    transactionList.innerHTML = "";

    let totalIncome = 0;
    let totalExpenses = 0;

    let categoryTotals = {};
    let monthlyTotals = {};
    let yearlyTotals = {};

    snapshot.forEach((docSnapshot) => {

      const data = docSnapshot.data();
      const docId = docSnapshot.id;

      const formattedDate = data.date
        ? data.date.toDate().toISOString().split("T")[0]
        : "";

      const date = data.date ? data.date.toDate() : null;

      if (data.type === "income") {
        totalIncome += data.amount;
      } else {

        totalExpenses += data.amount;

        // Category totals
        if (!categoryTotals[data.category]) {
          categoryTotals[data.category] = 0;
        }

        categoryTotals[data.category] += data.amount;

        // Monthly trend
        if (date) {

          const month = date.toLocaleString("default", { month: "short" });
          const year = date.getFullYear();

          const monthKey = `${month} ${year}`;

          if (!monthlyTotals[monthKey]) {
            monthlyTotals[monthKey] = 0;
          }

          monthlyTotals[monthKey] += data.amount;

          // Yearly trend
          if (!yearlyTotals[year]) {
            yearlyTotals[year] = 0;
          }

          yearlyTotals[year] += data.amount;
        }
      }

      const div = document.createElement("div");

      div.className =
        "flex justify-between border-b border-black pb-2";

      div.innerHTML = `
        <div>
          <p class="font-semibold">${data.description}</p>
          <p class="text-sm text-gray-600">
            ${data.category} • ${data.wallet} •
            ${data.date ? data.date.toDate().toLocaleDateString() : ""}
          </p>
        </div>

        <div class="flex items-center gap-4">
          <p class="font-bold ${
            data.type === "income"
              ? "text-green-600"
              : "text-red-600"
          }">
            ₱${formatCurrency(data.amount)}
          </p>

        <button
          type="button"
          class="text-blue-600 font-bold"
          onclick="openEditModal('${docId}', '${data.description}', ${data.amount}, '${data.type}', '${data.category}', '${data.wallet}', '${formattedDate}')">
          Edit
        </button>

          <button
            class="text-red-600 font-bold"
            onclick="deleteTransaction('${docId}')">
            ✕
          </button>
        </div>
      `;

      transactionList.appendChild(div);
    });

    const remaining = totalIncome - totalExpenses;

    totalIncomeEl.textContent = `₱${formatCurrency(totalIncome)}`;
    totalExpensesEl.textContent = `₱${formatCurrency(totalExpenses)}`;
    remainingBalanceEl.textContent = `₱${formatCurrency(remaining)}`;

    // Update charts
    createIncomeExpenseChart(totalIncome, totalExpenses);
    createCategoryChart(categoryTotals);
    createMonthlyTrendChart(monthlyTotals);
    createYearlyTrendChart(yearlyTotals);
    generateInsight(categoryTotals);
  });
}

async function deleteTransaction(id) {

  const confirmDelete = confirm("Delete this transaction?");
  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "transactions", id));
  } catch (error) {
    console.error("Error deleting transaction:", error);
  }
}

function openEditModal(id, description, amount, type, category, wallet, date) {

  document.getElementById("editModal").dataset.id = id;

  document.getElementById("editDescription").value = description;
  document.getElementById("editAmount").value = amount;
  document.getElementById("editType").value = type;
  document.getElementById("editDate").value = date;

  const editWallet = document.getElementById("editWallet");
  const walletSelect = document.getElementById("walletSelect");

  editWallet.innerHTML = walletSelect.innerHTML;
  editWallet.value = wallet;

  const categorySelect = document.getElementById("editCategory");
  const customInput = document.getElementById("editCustomCategory");

  const defaultCategories = ["Food","Transport","Bills","Shopping","Salary","Other"];

  if (defaultCategories.includes(category)) {
    categorySelect.value = category;
    customInput.value = "";
  } else {
    categorySelect.value = "Other";
    customInput.classList.remove("invisible");
    customInput.value = category;
  }

  checkEditCategory();

  const editModal = document.getElementById("editModal");
  editModal.classList.remove("hidden");
}

function checkEditCategory() {

  const category = document.getElementById("editCategory").value;
  const customInput = document.getElementById("editCustomCategory");

  if (category === "Other") {
    customInput.classList.remove("invisible");
    customInput.required = true;
  } else {
    customInput.classList.add("invisible");
    customInput.required = false;
    customInput.value = "";
  }
}

export {
  loadTransactions,
  deleteTransaction,
  openEditModal,
  checkEditCategory
};

window.deleteTransaction = deleteTransaction;
window.openEditModal = openEditModal;
window.modalEditId = modalEditId;