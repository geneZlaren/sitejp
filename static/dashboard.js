document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const userId = body.dataset.userId;
  const saveUrl = body.dataset.saveUrl;
  const uploadUrl = body.dataset.uploadUrl;
  const exampleUrl = body.dataset.exampleUrl;
  const defaultAvatar = body.dataset.defaultAvatar;
  const storageAvatar = `sitejp_avatar_${userId}`;

  const overlay = document.getElementById("overlay");
  const sheetProjeto = document.getElementById("sheetProjeto");
  const sheetDelete = document.getElementById("sheetDelete");
  const sheetExcelInfo = document.getElementById("sheetExcelInfo");
  const allSheets = [sheetProjeto, sheetDelete, sheetExcelInfo];

  const profile = document.getElementById("profile");
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  const profilePanel = document.getElementById("profilePanel");
  const avatarTop = document.getElementById("avatarTop");
  const cards = document.getElementById("cards");
  const countEls = document.querySelectorAll(".js-count");

  const form = document.getElementById("formProjeto");
  const formError = document.getElementById("formError");
  const btnSave = document.getElementById("btnSave");
  const periodosInput = document.getElementById("periodos");
  const camposDemanda = document.getElementById("camposDemanda");
  const demandaHint = document.getElementById("demandaHint");
  const excelFile = document.getElementById("excelFile");
  const excelStatus = document.getElementById("excelStatus");
  const importPreview = document.getElementById("importPreview");
  const importPreviewValues = document.getElementById("importPreviewValues");
  const importBadge = document.getElementById("importBadge");
  const modeButtons = document.querySelectorAll(".mode-btn");
  const panels = document.querySelectorAll("[data-mode-panel]");

  let currentMode = "manual";
  let importedDemandas = [];
  let pendingDeleteId = null;
  let pendingDeleteCard = null;

  function animateCount(element, toValue) {
    const target = Number(toValue || 0);
    const startValue = Number(element.textContent || 0);
    const startedAt = performance.now();
    const duration = 520;

    function frame(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(startValue + (target - startValue) * eased);
      element.textContent = String(current);
      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  }

  function syncProjectCount() {
    const total = cards.querySelectorAll(".card-link").length;
    countEls.forEach((element) => {
      element.dataset.count = String(total);
      animateCount(element, total);
    });
  }

  function revealCards() {
    const items = cards.querySelectorAll(".card-link");
    if (!items.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = Number(entry.target.dataset.revealDelay || 0);
        setTimeout(() => {
          entry.target.classList.add("is-revealed");
        }, delay);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16 });

    items.forEach((item, index) => {
      item.dataset.revealDelay = String(Math.min(index * 45, 220));
      observer.observe(item);
    });
  }

  function openSheet(sheet) {
    overlay.hidden = false;
    sheet.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add("show");
      sheet.classList.add("show");
    });
  }

  function closeSheet(sheet) {
    sheet.classList.remove("show");
    setTimeout(() => {
      sheet.hidden = true;
      const anyVisible = allSheets.some((item) => !item.hidden);
      if (!anyVisible) {
        overlay.classList.remove("show");
        setTimeout(() => {
          overlay.hidden = true;
        }, 180);
      }
    }, 220);
  }

  function closeSheets() {
    overlay.classList.remove("show");
    allSheets.forEach((sheet) => sheet.classList.remove("show"));
    setTimeout(() => {
      overlay.hidden = true;
      allSheets.forEach((sheet) => {
        sheet.hidden = true;
      });
    }, 220);
  }

  function closeInfoSheet() {
    closeSheet(sheetExcelInfo);
  }

  function showFormError(message) {
    formError.hidden = false;
    formError.textContent = message;
  }

  function clearFormError() {
    formError.hidden = true;
    formError.textContent = "";
  }

  function renderDemandInputs(periodos, values = []) {
    camposDemanda.innerHTML = "";
    if (!periodos || periodos < 2) {
      demandaHint.textContent = "Defina o numero de periodos para gerar os campos.";
      return;
    }

    demandaHint.textContent = "Preencha os valores ou mude para importacao por Excel.";
    for (let i = 1; i <= periodos; i += 1) {
      const wrapper = document.createElement("div");
      wrapper.className = "field";

      const label = document.createElement("label");
      label.textContent = `Periodo ${i}`;

      const input = document.createElement("input");
      input.type = "number";
      input.required = true;
      input.min = "0";
      input.step = "1";
      input.inputMode = "numeric";
      input.name = `demanda_${i}`;
      input.className = "demanda-input";
      input.placeholder = `Ex: ${100 + i}`;
      if (values[i - 1] !== undefined) {
        input.value = values[i - 1];
      }

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      camposDemanda.appendChild(wrapper);
    }
  }

  function setManualInputsEnabled(enabled) {
    periodosInput.disabled = !enabled;
    periodosInput.required = enabled;
    camposDemanda.querySelectorAll("input").forEach((input) => {
      input.disabled = !enabled;
      input.required = enabled;
    });
  }

  function setMode(mode) {
    currentMode = mode;
    modeButtons.forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.classList.toggle("primary", active);
      button.classList.toggle("ghost", !active);
    });
    panels.forEach((panel) => {
      const active = panel.dataset.modePanel === mode;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    setManualInputsEnabled(mode === "manual");
    excelFile.disabled = mode !== "excel";
    clearFormError();
  }

  function updateImportPreview(values) {
    importedDemandas = values.slice();
    importPreview.hidden = !values.length;
    importBadge.textContent = `${values.length} periodos importados`;
    importPreviewValues.innerHTML = "";
    values.slice(0, 18).forEach((value, index) => {
      const pill = document.createElement("span");
      pill.className = "stat-pill";
      pill.innerHTML = `<b>P${index + 1}</b> ${value}`;
      importPreviewValues.appendChild(pill);
    });
    if (values.length > 18) {
      const more = document.createElement("span");
      more.className = "stat-pill";
      more.textContent = `+${values.length - 18} valores`;
      importPreviewValues.appendChild(more);
    }
  }

  async function postJson(url, bodyData) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Falha na operacao.");
    }
    return data;
  }

  function attachDeleteHandlers() {
    document.querySelectorAll(".card-delete").forEach((button) => {
      button.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        pendingDeleteId = button.dataset.id;
        pendingDeleteCard = button.closest(".card-link");
        document.getElementById("deleteInfo").innerHTML = `Projeto: <b>${button.dataset.nome}</b><br>Digite <b>DELETAR</b> para confirmar.`;
        document.getElementById("deleteConfirm").value = "";
        document.getElementById("deleteError").hidden = true;
        openSheet(sheetDelete);
      };
    });
  }

  function resetProjectForm() {
    form.reset();
    importedDemandas = [];
    excelStatus.textContent = "Nenhum arquivo carregado.";
    importPreview.hidden = true;
    importPreviewValues.innerHTML = "";
    periodosInput.value = "";
    camposDemanda.innerHTML = "";
    demandaHint.textContent = "Digite manualmente ou importe um Excel no formato correto.";
    setMode("manual");
  }

  document.getElementById("btnOpenModal").addEventListener("click", () => openSheet(sheetProjeto));
  document.getElementById("btnCloseProjeto").addEventListener("click", closeSheets);
  document.getElementById("btnCancelProjeto").addEventListener("click", closeSheets);
  document.getElementById("btnCloseDelete").addEventListener("click", closeSheets);
  document.getElementById("btnCancelDelete").addEventListener("click", closeSheets);
  document.getElementById("btnExcelInfo").addEventListener("click", () => openSheet(sheetExcelInfo));
  document.getElementById("btnCloseExcelInfo").addEventListener("click", closeInfoSheet);
  document.getElementById("btnExcelInfoOk").addEventListener("click", closeInfoSheet);
  overlay.addEventListener("click", () => {
    if (!sheetExcelInfo.hidden) {
      closeInfoSheet();
      return;
    }
    closeSheets();
  });

  document.getElementById("btnOpenSettings").addEventListener("click", (event) => {
    event.stopPropagation();
    profileMenu.classList.remove("open");
    profilePanel.classList.toggle("open");
  });

  profileBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = profileMenu.classList.toggle("open");
    profileBtn.setAttribute("aria-expanded", String(isOpen));
    profilePanel.classList.remove("open");
  });

  document.addEventListener("click", (event) => {
    if (!profile.contains(event.target)) {
      profileMenu.classList.remove("open");
      profilePanel.classList.remove("open");
      profileBtn.setAttribute("aria-expanded", "false");
    }
  });

  const savedAvatar = localStorage.getItem(storageAvatar);
  if (savedAvatar) {
    avatarTop.src = savedAvatar;
  }

  document.getElementById("avatarInput").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      avatarTop.src = reader.result || defaultAvatar;
      localStorage.setItem(storageAvatar, avatarTop.src);
    };
    reader.readAsDataURL(file);
  });

  const senhaError = document.getElementById("senhaError");
  function showSenhaError(message) {
    senhaError.hidden = false;
    senhaError.textContent = message;
  }

  document.getElementById("btnSalvarSenha").addEventListener("click", async () => {
    senhaError.hidden = true;
    try {
      const data = await postJson("/perfil/senha", {
        senha_atual: document.getElementById("senhaAtual").value,
        senha_nova: document.getElementById("senhaNova").value,
        confirmar: document.getElementById("senhaConf").value
      });
      if (data.ok) {
        document.getElementById("senhaAtual").value = "";
        document.getElementById("senhaNova").value = "";
        document.getElementById("senhaConf").value = "";
        showSenhaError("Senha alterada com sucesso.");
      }
    } catch (error) {
      showSenhaError(error.message);
    }
  });

  periodosInput.addEventListener("input", () => {
    const periodos = parseInt(periodosInput.value || "0", 10);
    renderDemandInputs(periodos);
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  document.getElementById("btnImportExcel").addEventListener("click", async () => {
    clearFormError();
    const file = excelFile.files && excelFile.files[0];
    if (!file) {
      return showFormError("Selecione um arquivo Excel para importar.");
    }

    const payload = new FormData();
    payload.append("arquivo", file);
    excelStatus.textContent = "Lendo arquivo...";

    try {
      const response = await fetch(uploadUrl, { method: "POST", body: payload });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Falha ao ler o Excel.");
      }
      excelStatus.textContent = `Arquivo lido: ${file.name}`;
      updateImportPreview(data.demandas || []);
    } catch (error) {
      excelStatus.textContent = "Nenhum arquivo carregado.";
      updateImportPreview([]);
      showFormError(error.message);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormError();

    const nome = document.getElementById("nome").value.trim();
    const responsavel = document.getElementById("responsavel").value.trim();
    const descricao = document.getElementById("descricao").value.trim();

    let demandas = [];
    let periodos = 0;

    if (currentMode === "manual") {
      periodos = parseInt(periodosInput.value || "0", 10);
      if (periodos < 2) {
        return showFormError("Informe ao menos 2 periodos.");
      }
      for (let i = 1; i <= periodos; i += 1) {
        const input = form.querySelector(`[name="demanda_${i}"]`);
        if (!input || input.value === "") {
          return showFormError("Preencha todas as demandas manuais.");
        }
        demandas.push(input.value);
      }
    } else {
      demandas = importedDemandas.slice();
      periodos = demandas.length;
      if (!periodos) {
        return showFormError("Importe um arquivo Excel antes de salvar.");
      }
    }

    if (!nome || !responsavel || !descricao) {
      return showFormError("Preencha nome do projeto, funcionario e descricao.");
    }

    btnSave.disabled = true;
    btnSave.textContent = "Salvando...";
    try {
      const data = await postJson(saveUrl, { nome, responsavel, descricao, periodos, demandas });
      const projeto = data.projeto;

      const card = document.createElement("a");
      card.className = "card card-link";
      card.dataset.id = projeto.id;
      card.href = `/projeto/${projeto.id}`;
      card.innerHTML = `
        <div class="card-header">
          <div>
            <h2 class="card-title"></h2>
            <p class="card-subline">Funcionario: <b></b></p>
          </div>
          <span class="badge"></span>
        </div>
        <p class="card-desc"></p>
        <div class="card-meta">
          <span class="meta-item">Metodo: <b>${projeto.melhor_modelo_label || projeto.melhor_modelo || "-"}</b></span>
          <span class="meta-item">MAD: <b>${Number(projeto.mad ?? 0).toFixed(2)}</b></span>
        </div>
        <div class="card-actions">
          <button class="card-delete" type="button" data-id="${projeto.id}" data-nome="${projeto.nome}">Excluir projeto</button>
        </div>
      `;
      card.querySelector(".card-title").textContent = projeto.nome;
      card.querySelector(".card-subline b").textContent = projeto.responsavel || "-";
      card.querySelector(".badge").textContent = `${projeto.periodos} periodos`;
      card.querySelector(".card-desc").textContent = projeto.descricao;

      const empty = cards.querySelector(".empty");
      if (empty) empty.remove();
      cards.prepend(card);
      card.classList.add("is-revealed");
      attachDeleteHandlers();
      syncProjectCount();
      resetProjectForm();
      closeSheets();
    } catch (error) {
      showFormError(error.message);
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = "Salvar";
    }
  });

  document.getElementById("btnDoDelete").addEventListener("click", async () => {
    const deleteError = document.getElementById("deleteError");
    deleteError.hidden = true;
    try {
      await postJson(`/projeto/${pendingDeleteId}/deletar`, {
        confirmacao: document.getElementById("deleteConfirm").value.trim()
      });
      if (pendingDeleteCard) {
        pendingDeleteCard.remove();
      }
      if (!cards.querySelector(".card-link")) {
        cards.innerHTML = '<div class="empty"><p>Nenhum projeto ainda. Clique em "Novo Projeto".</p></div>';
      }
      syncProjectCount();
      closeSheets();
    } catch (error) {
      deleteError.hidden = false;
      deleteError.textContent = error.message;
    }
  });

  attachDeleteHandlers();
  revealCards();
  syncProjectCount();

  if (exampleUrl) {
    const preload = new Image();
    preload.src = exampleUrl;
  }
});
