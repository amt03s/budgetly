import { db, auth } from "../firebase.js";
import { formatCurrency } from "../utils/format.js";
import { showSection } from "../dashboard.js";

let unsubscribeSingleWallet = null;
let activeWalletItem = null;

let walletToEditId = null;
let walletToEditName = null;
let walletToDeleteId = null;

import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
  writeBatch,
  orderBy,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


function loadWallets(uid, walletSelect, walletCards, state) {

  const walletQuery = query(
    collection(db, "wallets"),
    where("userId", "==", uid)
  );

  const transactionQuery = query(
    collection(db, "transactions"),
    where("userId", "==", uid)
  );

  onSnapshot(walletQuery, (walletSnapshot) => {

    onSnapshot(transactionQuery, (transactionSnapshot) => {

      // Clear dropdown
      walletSelect.innerHTML = `
        <option value="" disabled selected hidden>
          Select Wallet
        </option>
      `;

      // Clear wallet cards
      walletCards.innerHTML = "";

      const walletArray = [];

    walletSnapshot.forEach((walletDoc) => {

      const walletData = walletDoc.data();
      const walletName = walletData.name;

      // Save for sidebar
      walletArray.push({ name: walletName });

      // -------- Calculate Balance --------
      let balance = 0;

      transactionSnapshot.forEach((txDoc) => {
        const tx = txDoc.data();

        if (tx.wallet === walletName) {
          if (tx.type === "income") {
            balance += tx.amount;
          } else {
            balance -= tx.amount;
          }
        }
      });

      // -------- Add to Transaction Form Dropdown --------
      const option = document.createElement("option");
      option.value = walletName;
      option.textContent = walletName;
      walletSelect.appendChild(option);

      // -------- Create Wallet Card --------
      const card = document.createElement("div");
      card.className = "border border-black p-6 rounded-xl";

      card.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold">${walletName}</h3>
            <p class="text-xl mt-2 ${balance >= 0 ? "text-green-600" : "text-red-600"}">
              ₱${formatCurrency(balance)}
            </p>
          </div>

          <div class="flex gap-3">
            <button
              class="text-blue-600 font-semibold"
              onclick="editWallet('${walletDoc.id}', '${walletName}')">
              Edit
            </button>

            <button
              class="text-red-600 font-semibold"
              onclick="deleteWallet('${walletDoc.id}')">
              ✕
            </button>
          </div>
        </div>
      `;

      walletCards.appendChild(card);

    });

    populateWalletSidebar(walletArray, state);

    });

  });
}


function populateWalletSidebar(wallets, state) {

  const dropdown = document.getElementById("walletDropdown");
  dropdown.innerHTML = "";

  // -------- INDIVIDUAL WALLETS --------
  wallets.forEach(wallet => {

    const item = document.createElement("div");
    item.textContent = wallet.name;
    item.className = "cursor-pointer pl-8";

    item.onclick = () => {

    state.currentWallet = wallet.name;
    state.currentFilter = "all";

      document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("underline", "font-semibold");
      });

      document.querySelector(".filter-btn").classList.add("underline", "font-semibold");

      if (activeWalletItem) {
        activeWalletItem.classList.remove("underline", "font-semibold");
      }

      item.classList.add("underline", "font-semibold");
      activeWalletItem = item;

      showSingleWallet(auth.currentUser.uid, wallet.name, state);
    };

        dropdown.appendChild(item);
      });
    }

function showSingleWallet(uid, walletName, state) {

  if (unsubscribeSingleWallet) {
  unsubscribeSingleWallet();
}

  showSection("singleWallet");

  const title = document.getElementById("singleWalletTitle");
  const balanceEl = document.getElementById("singleWalletBalance");
  const transactionContainer = document.getElementById("singleWalletTransactions");

  title.textContent = walletName;
  transactionContainer.innerHTML = "";

  let constraints = [
    where("userId", "==", uid),
    where("wallet", "==", walletName),
    orderBy("date", "desc")
  ];

  // APPLY DATE FILTER
  const today = new Date();
  let startDate = null;

  if (state.currentFilter === "week") {
    startDate = new Date();
    startDate.setDate(today.getDate() - 7);
  }

  if (state.currentFilter === "month") {
    startDate = new Date();
    startDate.setMonth(today.getMonth() - 1);
  }

  if (state.currentFilter === "year") {
    startDate = new Date();
    startDate.setFullYear(today.getFullYear() - 1);
  }

  if (startDate) {
    constraints.push(
      where("date", ">=", Timestamp.fromDate(startDate))
    );
  }

  const q = query(collection(db, "transactions"), ...constraints);

  unsubscribeSingleWallet = onSnapshot(q, (snapshot) => {

    let balance = 0;
    transactionContainer.innerHTML = "";

    snapshot.forEach((docSnapshot) => {

      const data = docSnapshot.data();

      if (data.type === "income") {
        balance += data.amount;
      } else {
        balance -= data.amount;
      }

      const div = document.createElement("div");
      div.className = "flex justify-between border-b border-black pb-2";

      div.innerHTML = `
        <div>
          <p class="font-semibold">${data.description}</p>
          <p class="text-sm text-gray-600">
            ${data.category} • ${
              data.date
                ? (typeof data.date.toDate === "function"
                    ? data.date.toDate().toLocaleDateString()
                    : new Date(data.date).toLocaleDateString())
                : ""
            }
          </p>
        </div>

        <p class="font-bold ${
          data.type === "income"
            ? "text-green-600"
            : "text-red-600"
        }">
          ₱${formatCurrency(data.amount)}
        </p>
      `;

      transactionContainer.appendChild(div);
    });

    balanceEl.textContent = `₱${formatCurrency(balance)}`;

  });
}

window.deleteWallet = function(id) {
  walletToDeleteId = id;
  document.getElementById("deleteWalletModal").classList.remove("hidden");
};

window.editWallet = function(id, currentName) {

  walletToEditId = id;
  walletToEditName = currentName;

  document.getElementById("editWalletNameInput").value = currentName;

  document.getElementById("editWalletModal").classList.remove("hidden");
};

window.confirmDeleteWallet = async function() {

  try {
    await deleteDoc(doc(db, "wallets", walletToDeleteId));
    closeDeleteWalletModal();
  } catch (error) {
    console.error("Error deleting wallet:", error);
  }
};

window.confirmEditWallet = async function() {

  const newName = document.getElementById("editWalletNameInput").value.trim();
  if (!newName) return;

  // CLOSE MODAL IMMEDIATELY
  closeEditWalletModal();

  try {

    await updateDoc(doc(db, "wallets", walletToEditId), {
      name: newName
    });

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", auth.currentUser.uid),
      where("wallet", "==", walletToEditName)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.forEach((docSnap) => {
      batch.update(doc(db, "transactions", docSnap.id), {
        wallet: newName
      });
    });

    await batch.commit();

  } catch (error) {
    console.error("Error updating wallet:", error);
  }
};

window.closeEditWalletModal = function() {
  document.getElementById("editWalletModal").classList.add("hidden");
};

window.closeDeleteWalletModal = function() {
  document.getElementById("deleteWalletModal").classList.add("hidden");
};

window.toggleWalletDropdown = function() {

  const dropdown = document.getElementById("walletDropdown");

  dropdown.classList.toggle("hidden");
  showSection("wallets");

  if (activeWalletItem) {
    activeWalletItem.classList.remove("underline", "font-semibold");
    activeWalletItem = null;
  }
};

export {
  loadWallets,
  showSingleWallet
};