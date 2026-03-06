import { db, auth } from "./firebase.js";
import { loadWallets, showSingleWallet } from "./wallets/wallets.js";
import {
  loadTransactions,
  deleteTransaction,
  openEditModal,
  checkEditCategory
} from "./transactions/transactions.js";

window.deleteTransaction = deleteTransaction;
window.openEditModal = openEditModal;
window.checkEditCategory = checkEditCategory;

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("transactionForm");
const transactionList = document.getElementById("transactionList");
const walletSelect = document.getElementById("walletSelect");
const walletCards = document.getElementById("walletCards");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");
const remainingBalanceEl = document.getElementById("remainingBalance");

const elements = {
  transactionList,
  totalIncomeEl,
  totalExpensesEl,
  remainingBalanceEl
};

const state = {
  currentWallet: null,
  currentFilter: "all"
};

// let editId = null;
let modalEditId = null;

let unsubscribeTransactions = null;
let unsubscribeSingleWallet = null;

const editModal = document.getElementById("editModal");

window.closeModal = function() {
  editModal.classList.add("hidden");
};

const transactionDateInput = document.getElementById("transactionDate");

// Set default date to today
const today = new Date().toISOString().split("T")[0];
transactionDateInput.value = today;
transactionDateInput.max = today;

// Protect dashboard + load transactions
import { protectRoute } from "./auth/protectRoute.js";

protectRoute((user) => {
  loadTransactions(user.uid, elements, state);
  loadWallets(user.uid, walletSelect, walletCards, state);
});

// ➕ Add Transaction
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!auth.currentUser) {
    alert("User not logged in.");
    return;
  }

  const wallet = document.getElementById("walletSelect").value;
  const description = document.getElementById("description").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const categorySelect = document.getElementById("category").value;
  const customCategory = document.getElementById("customCategory").value;
  const selectedDate = document.getElementById("transactionDate").value;

  const finalCategory =
    categorySelect === "Other"
      ? customCategory
      : categorySelect;

  try {

    await addDoc(collection(db, "transactions"), {
      userId: auth.currentUser.uid,
      wallet,
      description,
      amount,
      type,
      category: finalCategory,
      date: Timestamp.fromDate(new Date(selectedDate)),
      createdAt: new Date()
    });

    form.reset();
    document.getElementById("customCategory").classList.add("invisible");

  } catch (error) {
    console.error("Error saving transaction:", error);
  }
});

const editForm = document.getElementById("editForm");

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const categorySelect = document.getElementById("editCategory").value;
  const customCategory = document.getElementById("editCustomCategory").value;

  const finalCategory =
    categorySelect === "Other"
      ? customCategory
      : categorySelect;

  try {
    await updateDoc(doc(db, "transactions", modalEditId), {
      description: document.getElementById("editDescription").value,
      amount: parseFloat(document.getElementById("editAmount").value),
      type: document.getElementById("editType").value,
      wallet: document.getElementById("editWallet").value,
      category: finalCategory,
      date: Timestamp.fromDate(
        new Date(document.getElementById("editDate").value)
)
    });

    closeModal();

  } catch (error) {
    console.error("Error updating transaction:", error);
  }
});

window.checkEditCategory = function() {
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
};

window.setFilter = function(filter, button) {

  state.currentFilter = filter;

  // Remove underline from all buttons
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("underline", "font-semibold");
  });

  // Underline clicked button
  button.classList.add("underline", "font-semibold");

  if (state.currentWallet) {
    // If inside single wallet view
    showSingleWallet(auth.currentUser.uid, state.currentWallet, state);
  } else {
    // If inside normal transactions view
    loadTransactions(auth.currentUser.uid, elements, state);
  }
};

window.goToTransactions = function() {
  state.currentWallet = null;
  showSection("transactions");
  loadTransactions(auth.currentUser.uid, elements, state);
};

function showSection(section) {

  if (section !== "transactions" && section !== "singleWallet") {
  state.currentFilter = "all";

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("underline", "font-semibold");
  });

  const firstFilterBtn = document.querySelector(".filter-btn");
  if (firstFilterBtn) {
    firstFilterBtn.classList.add("underline", "font-semibold");
  }
}

  if (section !== "singleWallet") {
    state.currentWallet = null;
  }

  document.getElementById("overviewSection").classList.add("hidden");
  document.getElementById("transactionsSection").classList.add("hidden");
  document.getElementById("walletsSection").classList.add("hidden");
  document.getElementById("singleWalletSection").classList.add("hidden");

  document.getElementById(section + "Section").classList.remove("hidden");
};

window.logout = function() {
  window.location.href = "login.html";
};

export { showSection };