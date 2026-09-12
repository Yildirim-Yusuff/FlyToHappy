// =====================================================
// NAVBAR
// Language dropdown, currency dropdown, hamburger menu
// and the login/register modal. Shared by Home and the
// search/booking pages. Auth source of truth is the Identity
// cookie, checked through GET /api/Auth/me.
// =====================================================

(function () {
    "use strict";

    const langToggle = document.querySelector("#langToggle");
    const langDropdown = document.querySelector("#langDropdown");
    const langLabel = document.querySelector("#langLabel");

    const currencyToggle = document.querySelector("#currencyToggle");
    const currencyDropdown = document.querySelector("#currencyDropdown");
    const currencySymbol = document.querySelector("#currencySymbol");
    const currencyCode = document.querySelector("#currencyCode");

    const menuToggle = document.querySelector("#menuToggle");
    const userDropdown = document.querySelector("#userDropdown");

    const signInButton = document.querySelector("#signInButton");
    const authModal = document.querySelector("#authModal");


    // =================================================
    // DROPDOWNS (only one can be open at a time)
    // =================================================

    function closeDropdown(toggle, dropdown) {
        if (!toggle || !dropdown) {
            return;
        }

        dropdown.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
    }

    function closeAllDropdowns() {
        closeDropdown(langToggle, langDropdown);
        closeDropdown(currencyToggle, currencyDropdown);
        closeDropdown(menuToggle, userDropdown);
    }

    function toggleDropdown(toggle, dropdown) {
        const wasOpen = dropdown.classList.contains("open");

        closeAllDropdowns();

        if (!wasOpen) {
            dropdown.classList.add("open");
            toggle.setAttribute("aria-expanded", "true");
        }
    }

    function markActiveOption(dropdown, chosenOption) {
        dropdown.querySelectorAll(".lang-option").forEach(function (option) {
            option.classList.remove("active");
        });

        chosenOption.classList.add("active");
    }


    // =================================================
    // LANGUAGE (TR / EN) — UI only, no translation backend
    // =================================================

    if (langToggle && langDropdown) {
        langToggle.addEventListener("click", function (event) {
            event.stopPropagation();
            toggleDropdown(langToggle, langDropdown);
        });

        langDropdown.querySelectorAll(".lang-option").forEach(function (option) {
            option.addEventListener("click", function () {
                markActiveOption(langDropdown, option);
                langLabel.textContent = option.dataset.lang;
                closeDropdown(langToggle, langDropdown);
            });
        });
    }


    // =================================================
    // CURRENCY (₺ TRY / $ USD / € EUR) — UI only, no conversion
    // =================================================

    if (currencyToggle && currencyDropdown) {
        currencyToggle.addEventListener("click", function (event) {
            event.stopPropagation();
            toggleDropdown(currencyToggle, currencyDropdown);
        });

        currencyDropdown.querySelectorAll(".lang-option").forEach(function (option) {
            option.addEventListener("click", function () {
                markActiveOption(currencyDropdown, option);
                currencySymbol.textContent = option.dataset.symbol;
                currencyCode.textContent = option.dataset.currency;
                closeDropdown(currencyToggle, currencyDropdown);
            });
        });
    }


    // =================================================
    // HAMBURGER MENU
    // =================================================

    if (menuToggle && userDropdown) {
        menuToggle.addEventListener("click", function (event) {
            event.stopPropagation();
            toggleDropdown(menuToggle, userDropdown);
        });
    }

    // Click outside any menu closes them all.
    document.addEventListener("click", function (event) {
        if (!event.target.closest(".lang-menu") && !event.target.closest(".user-menu")) {
            closeAllDropdowns();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeAllDropdowns();

            if (authModal && authModal.open) {
                closeAuthModal();
            }
        }
    });


    // =================================================
    // "SEYAHATLERİM" LINK  (/#seyahatlerim opens the My Trips tab)
    // =================================================

    function openMyTripsTabFromHash() {
        if (window.location.hash !== "#seyahatlerim") {
            return;
        }

        const myTripsTab = document.querySelector('.booking-main-tab[data-panel="my-trips"]');

        if (myTripsTab) {
            myTripsTab.click();
            myTripsTab.scrollIntoView({ block: "center" });
        }
    }

    window.addEventListener("load", openMyTripsTabFromHash);
    window.addEventListener("hashchange", openMyTripsTabFromHash);


    // =================================================
    // AUTH STATE
    // The Identity cookie is the source of truth. Nothing is stored in
    // localStorage; the page asks the backend who is logged in.
    // =================================================

    const userButton = document.querySelector("#userButton");
    const userNameLabel = document.querySelector("#userButton .user-name");
    const logoutButton = document.querySelector("#logoutButton");

    function showLoggedInState(user) {
        document.body.classList.add("is-logged-in");

        if (userNameLabel) {
            userNameLabel.textContent = user.firstName || user.email;
        }

        if (userButton) {
            userButton.title = (user.firstName || "") + " " + (user.lastName || "");
        }
    }

    function showLoggedOutState() {
        document.body.classList.remove("is-logged-in");

        if (userNameLabel) {
            userNameLabel.textContent = "Kullanıcı";
        }

        if (userButton) {
            userButton.title = "";
        }
    }

    async function loadCurrentUser() {
        try {
            const response = await fetch("/api/Auth/me");

            // 401 simply means "not logged in" — that is a normal state, not an error.
            if (!response.ok) {
                showLoggedOutState();
                return;
            }

            const data = await response.json();
            showLoggedInState(data.user);
        } catch (error) {
            showLoggedOutState();
        }
    }

    async function logoutUser() {
        closeAllDropdowns();

        try {
            const response = await fetch("/api/Auth/logout", { method: "POST" });

            if (response.ok) {
                showLoggedOutState();
            }
        } catch (error) {
            // Network problem: keep the current state, the user can try again.
        }
    }

    // The user name button opens the same menu as the hamburger.
    if (userButton && menuToggle && userDropdown) {
        userButton.addEventListener("click", function (event) {
            event.stopPropagation();
            toggleDropdown(menuToggle, userDropdown);
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", function (event) {
            event.preventDefault();
            logoutUser();
        });
    }

    loadCurrentUser();


    // =================================================
    // AUTH MODAL (login / register)
    // =================================================

    if (!authModal) {
        return;
    }

    const loginForm = document.querySelector("#loginForm");
    const registerForm = document.querySelector("#registerForm");

    function showMessage(element, text) {
        element.textContent = text;
        element.hidden = false;
    }

    function clearMessages(form) {
        form.querySelectorAll(".auth-error, .auth-note").forEach(function (element) {
            element.textContent = "";
            element.hidden = true;
        });

        form.querySelectorAll(".g-input").forEach(function (input) {
            input.classList.remove("invalid");
        });
    }

    function showAuthTab(tabName) {
        loginForm.hidden = tabName !== "login";
        registerForm.hidden = tabName !== "register";

        authModal.querySelectorAll(".auth-tab").forEach(function (tab) {
            tab.classList.toggle("active", tab.dataset.authTab === tabName);
        });
    }

    function openAuthModal(tabName) {
        closeAllDropdowns();
        clearMessages(loginForm);
        clearMessages(registerForm);
        showAuthTab(tabName);
        authModal.showModal();
        document.body.classList.add("auth-open");
        focusFirstField();
    }

    function focusFirstField() {
        const visibleForm = loginForm.hidden ? registerForm : loginForm;
        const firstField = visibleForm.querySelector(".g-input");

        if (firstField) {
            firstField.focus();
        }
    }

    function closeAuthModal() {
        if (authModal.open) {
            authModal.close();
        }

        document.body.classList.remove("auth-open");
    }

    if (signInButton) {
        signInButton.addEventListener("click", function (event) {
            event.preventDefault();
            openAuthModal("login");
        });
    }

    document.querySelector("#authClose").addEventListener("click", closeAuthModal);

    // Clicking the dark backdrop (outside .auth-body) closes the modal.
    authModal.addEventListener("click", function (event) {
        if (event.target === authModal) {
            closeAuthModal();
        }
    });

    // Escape inside the dialog fires "cancel"; route it through closeAuthModal so the page unlocks too.
    authModal.addEventListener("cancel", function (event) {
        event.preventDefault();
        closeAuthModal();
    });

    // Fallback for any other close path.
    authModal.addEventListener("close", function () {
        document.body.classList.remove("auth-open");
    });

    // Tab buttons and the "Kayıt Ol" / "Giriş Yap" switch links share data-auth-tab.
    authModal.querySelectorAll("[data-auth-tab]").forEach(function (button) {
        button.addEventListener("click", function () {
            showAuthTab(button.dataset.authTab);
            focusFirstField();
        });
    });

    // Show / hide password
    authModal.querySelectorAll(".auth-eye").forEach(function (eyeButton) {
        eyeButton.addEventListener("click", function () {
            const input = document.getElementById(eyeButton.dataset.eyeFor);
            const icon = eyeButton.querySelector("i");
            const showing = input.type === "text";

            input.type = showing ? "password" : "text";
            icon.className = showing ? "bi bi-eye" : "bi bi-eye-slash";
            eyeButton.setAttribute("aria-label", showing ? "Şifreyi göster" : "Şifreyi gizle");
        });
    });


    // =================================================
    // FORM HELPERS
    // =================================================

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function markInvalid(input) {
        input.classList.add("invalid");
        input.focus();
    }

    // Some responses (e.g. model binding errors) may not carry JSON we understand.
    async function readJson(response) {
        try {
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    // Backend errors look like { message, errors: [...] }.
    function formatApiError(data, fallbackText) {
        if (!data) {
            return fallbackText;
        }

        let text = data.message || fallbackText;

        if (Array.isArray(data.errors) && data.errors.length > 0) {
            text += " " + data.errors.join(" ");
        }

        return text;
    }


    // =================================================
    // LOGIN  → POST /api/Auth/login
    // =================================================

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearMessages(loginForm);

        const email = document.querySelector("#loginEmail");
        const password = document.querySelector("#loginPassword");
        const error = document.querySelector("#loginError");
        const submitButton = loginForm.querySelector(".auth-submit");

        // A request is already running (double submit / Enter spam).
        if (submitButton.disabled) {
            return;
        }

        if (!email.value.trim()) {
            markInvalid(email);
            showMessage(error, "Lütfen e-posta adresinizi girin.");
            return;
        }

        if (!isValidEmail(email.value.trim())) {
            markInvalid(email);
            showMessage(error, "Geçerli bir e-posta adresi girin.");
            return;
        }

        if (!password.value) {
            markInvalid(password);
            showMessage(error, "Lütfen şifrenizi girin.");
            return;
        }

        submitButton.disabled = true;

        try {
            const response = await fetch("/api/Auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.value.trim(),
                    password: password.value
                })
            });

            const data = await readJson(response);

            if (!response.ok) {
                markInvalid(password);
                showMessage(error, formatApiError(data, "E-posta veya şifre hatalı."));
                return;
            }

            showLoggedInState(data.user);
            closeAuthModal();
            loginForm.reset();
            registerForm.reset();
            clearMessages(loginForm);
            clearMessages(registerForm);
        } catch (networkError) {
            showMessage(error, "Sunucuya ulaşılamadı. Lütfen tekrar deneyin.");
        } finally {
            submitButton.disabled = false;
        }
    });


    // =================================================
    // REGISTER  → POST /api/Auth/register
    // =================================================

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearMessages(registerForm);

        const firstName = document.querySelector("#registerFirstName");
        const lastName = document.querySelector("#registerLastName");
        const email = document.querySelector("#registerEmail");
        const password = document.querySelector("#registerPassword");
        const passwordConfirm = document.querySelector("#registerPasswordConfirm");
        const error = document.querySelector("#registerError");
        const submitButton = registerForm.querySelector(".auth-submit");

        if (submitButton.disabled) {
            return;
        }

        if (!firstName.value.trim()) {
            markInvalid(firstName);
            showMessage(error, "Lütfen adınızı girin.");
            return;
        }

        if (!lastName.value.trim()) {
            markInvalid(lastName);
            showMessage(error, "Lütfen soyadınızı girin.");
            return;
        }

        if (!isValidEmail(email.value.trim())) {
            markInvalid(email);
            showMessage(error, "Geçerli bir e-posta adresi girin.");
            return;
        }

        if (password.value.length < 6) {
            markInvalid(password);
            showMessage(error, "Şifre en az 6 karakter olmalıdır.");
            return;
        }

        if (password.value !== passwordConfirm.value) {
            markInvalid(passwordConfirm);
            showMessage(error, "Şifreler birbiriyle eşleşmiyor.");
            return;
        }

        submitButton.disabled = true;

        try {
            const response = await fetch("/api/Auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: firstName.value.trim(),
                    lastName: lastName.value.trim(),
                    email: email.value.trim(),
                    password: password.value,
                    confirmPassword: passwordConfirm.value
                })
            });

            const data = await readJson(response);

            if (!response.ok) {
                // Keep what the user typed; only show the backend message.
                showMessage(error, formatApiError(data, "Kayıt yapılamadı."));
                return;
            }

            // Registered, but NOT logged in: move to the login tab with the e-mail ready.
            const registeredEmail = email.value.trim();

            registerForm.reset();
            showAuthTab("login");
            document.querySelector("#loginEmail").value = registeredEmail;
            let successText = data && data.message ? data.message : "Kayıt başarılı";
            if (!successText.endsWith(".")) {
                successText += ".";
            }
            showMessage(document.querySelector("#loginNote"), successText + " Şimdi giriş yapabilirsiniz.");
            document.querySelector("#loginPassword").focus();
        } catch (networkError) {
            showMessage(error, "Sunucuya ulaşılamadı. Lütfen tekrar deneyin.");
        } finally {
            submitButton.disabled = false;
        }
    });

})();
