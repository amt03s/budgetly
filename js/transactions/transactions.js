
import { db } from "../firebase.js";
import { formatCurrency } from "../utils/format.js";

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

    snapshot.forEach((docSnapshot) => {

      const data = docSnapshot.data();
      const docId = docSnapshot.id;

      const formattedDate = data.date
        ? data.date.toDate().toISOString().split("T")[0]
        : "";

      if (data.type === "income") {
        totalIncome += data.amount;
      } else {
        totalExpenses += data.amount;
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
};

function openEditModal(id, description, amount, type, category, wallet, date) {

  let modalEditId = null;

  document.getElementById("editDescription").value = description;
  document.getElementById("editAmount").value = amount;
  document.getElementById("editType").value = type;
  document.getElementById("editDate").value = date;

  // Copy wallet dropdown options
  const editWallet = document.getElementById("editWallet");
  editWallet.innerHTML = walletSelect.innerHTML;
  editWallet.value = wallet;

  document.getElementById("editCategory").value = category;

  // Trigger category check
  checkEditCategory();

  editModal.classList.remove("hidden");
};

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
};


export {
  loadTransactions,
  deleteTransaction,
  openEditModal,
  checkEditCategory
};