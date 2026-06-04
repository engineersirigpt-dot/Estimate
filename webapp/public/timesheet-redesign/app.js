const THEME_KEY = "timesheet-redesign-theme";

function getInitialTheme() {
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem(THEME_KEY, theme);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const isDark = theme === "dark";
    const icon = button.querySelector("i");
    const label = button.querySelector(".theme-toggle-label");

    if (icon) {
      icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }

    if (label) {
      label.textContent = isDark ? "โหมดสว่าง" : "โหมดมืด";
    }

    button.setAttribute("aria-label", isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด");
  });
}

function closeMenus() {
  document.querySelectorAll(".profile-menu.open").forEach((menu) => {
    menu.classList.remove("open");
    const trigger = menu.querySelector(".profile-chip");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  });
}

function bindThemeToggle() {
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next);
    });
  });
}

function bindProfileMenu() {
  document.querySelectorAll(".profile-menu").forEach((menu) => {
    const trigger = menu.querySelector(".profile-chip");
    if (!trigger) return;

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = menu.classList.contains("open");
      closeMenus();
      menu.classList.toggle("open", !isOpen);
      trigger.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  document.addEventListener("click", () => {
    closeMenus();
  });
}

function bindSidebarToggle() {
  document.querySelectorAll("[data-sidebar-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      if (window.innerWidth <= 1080) {
        document.body.classList.toggle("sidebar-open");
      } else {
        document.body.classList.toggle("sidebar-collapsed");
      }
    });
  });

  document.querySelectorAll("[data-sidebar-close]").forEach((button) => {
    button.addEventListener("click", () => {
      document.body.classList.remove("sidebar-open");
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1080) {
      document.body.classList.remove("sidebar-open");
    }
  });
}

function buildToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icons = {
    success: "fa-solid fa-circle-check",
    danger: "fa-solid fa-circle-xmark",
    warning: "fa-solid fa-triangle-exclamation",
    info: "fa-solid fa-circle-info"
  };

  toast.innerHTML = `
    <i class="${icons[type] || icons.info}"></i>
    <div>
      <strong>${message}</strong>
      <div class="type-caption">${type === "success" ? "อัปเดตข้อมูลเรียบร้อย" : "ตรวจสอบสถานะล่าสุด"}</div>
    </div>
  `;

  return toast;
}

function ensureToastStack() {
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = "success") {
  const stack = ensureToastStack();
  const toast = buildToast(message, type);
  stack.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
  }, 2400);

  window.setTimeout(() => {
    toast.remove();
  }, 2800);
}

function bindToasts() {
  document.querySelectorAll("[data-toast]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      if (trigger.tagName === "A" && !trigger.dataset.allowNavigation) {
        event.preventDefault();
      }

      showToast(trigger.dataset.toast, trigger.dataset.toastType || "success");
    });
  });
}

function formatBuddhistDate(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

function bindBuddhistDates() {
  const formatted = formatBuddhistDate();
  document.querySelectorAll("[data-buddhist-date]").forEach((input) => {
    if (!input.value) {
      input.value = formatted;
    }
  });
  document.querySelectorAll("[data-buddhist-date-helper]").forEach((node) => {
    node.textContent = `วันนี้ ${formatted} (พ.ศ.)`;
  });
}

function init() {
  setTheme(getInitialTheme());
  bindThemeToggle();
  bindProfileMenu();
  bindSidebarToggle();
  bindToasts();
  bindBuddhistDates();
}

document.addEventListener("DOMContentLoaded", init);
