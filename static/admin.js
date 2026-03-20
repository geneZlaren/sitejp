document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("overlay");
  const deleteSheet = document.getElementById("deleteUserSheet");
  const deleteInfo = document.getElementById("deleteUserInfo");
  const deleteConfirm = document.getElementById("deleteUserConfirm");
  const deleteError = document.getElementById("deleteUserError");
  const closeDelete = document.getElementById("btnCloseDeleteUser");
  const cancelDelete = document.getElementById("btnCancelDeleteUser");
  const doDelete = document.getElementById("btnDoDeleteUser");

  let pendingDeleteId = null;
  let pendingDeleteRow = null;

  function openDeleteSheet() {
    overlay.hidden = false;
    deleteSheet.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add("show");
      deleteSheet.classList.add("show");
    });
  }

  function closeDeleteSheet() {
    overlay.classList.remove("show");
    deleteSheet.classList.remove("show");
    setTimeout(() => {
      overlay.hidden = true;
      deleteSheet.hidden = true;
    }, 220);
    deleteError.hidden = true;
    deleteConfirm.value = "";
    pendingDeleteId = null;
    pendingDeleteRow = null;
  }

  async function postJson(url, body) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Falha na operacao.");
    }
    return data;
  }

  function setBusy(row, busy) {
    if (!row) return;
    row.classList.toggle("is-busy", busy);
  }

  function updateRowStatus(row, aprovado) {
    const pill = row.querySelector("[data-status-pill]");
    const actionButton = row.querySelector(".admin-action");

    pill.textContent = aprovado ? "Ativo" : "Pendente";
    pill.classList.toggle("status-pill--ok", aprovado);
    pill.classList.toggle("status-pill--pending", !aprovado);

    actionButton.dataset.action = aprovado ? "reprovar" : "aprovar";
    actionButton.textContent = aprovado ? "Desativar" : "Aprovar";
    actionButton.classList.toggle("primary", !aprovado);
    actionButton.classList.toggle("ghost", aprovado);
  }

  document.querySelectorAll("[data-user-row]").forEach((row, index) => {
    row.animate(
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 320, delay: index * 45, fill: "both", easing: "ease-out" }
    );
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const row = button.closest("[data-user-row]");
    const userId = button.dataset.id;
    const action = button.dataset.action;

    if (action === "deletar") {
      pendingDeleteId = userId;
      pendingDeleteRow = row;
      deleteInfo.innerHTML = `Usuario: <b>${button.dataset.email}</b><br>Digite <b>DELETAR</b> para confirmar a exclusao.`;
      openDeleteSheet();
      return;
    }

    setBusy(row, true);
    try {
      if (action === "aprovar") {
        await postJson(`/admin/usuarios/${userId}/aprovar`);
        updateRowStatus(row, true);
      } else if (action === "reprovar") {
        await postJson(`/admin/usuarios/${userId}/reprovar`);
        updateRowStatus(row, false);
      }
    } catch (error) {
      window.alert(error.message);
    } finally {
      setBusy(row, false);
    }
  });

  doDelete.addEventListener("click", async () => {
    deleteError.hidden = true;
    try {
      await postJson(`/admin/usuarios/${pendingDeleteId}/deletar`, {
        confirmacao: deleteConfirm.value.trim()
      });
      if (pendingDeleteRow) {
        pendingDeleteRow.classList.add("is-removed");
        setTimeout(() => pendingDeleteRow.remove(), 180);
      }
      closeDeleteSheet();
    } catch (error) {
      deleteError.hidden = false;
      deleteError.textContent = error.message;
    }
  });

  overlay.addEventListener("click", closeDeleteSheet);
  closeDelete.addEventListener("click", closeDeleteSheet);
  cancelDelete.addEventListener("click", closeDeleteSheet);
});
