// =====================================================
// SHARED SEARCH PANEL
// Used by both Home and SearchResults (single source).
// Self-initializing and null-safe: does nothing if the
// page has no .search-panel. Restores from sessionStorage
// and resets stale booking state on a new search.
// =====================================================

(function () {
    "use strict";

    const panel = document.querySelector(".search-panel");

    if (!panel || panel.dataset.searchInitialized === "true") {
        return;
    }
    panel.dataset.searchInitialized = "true";

    const byId = (id) => panel.querySelector("#" + id);

    const fromInput = byId("fromInput");
    const toInput = byId("toInput");
    const swapBtn = byId("swapBtn");
    const departInput = byId("departInput");
    const returnInput = byId("returnInput");
    const cabinSelect = byId("cabinSelect");
    const searchBtn = byId("searchBtn");

    const tripTabs = panel.querySelectorAll(".trip-tab");
    const stepButtons = panel.querySelectorAll(".step-btn");
    const mainTabs = panel.querySelectorAll(".booking-main-tab");
    const mainPanes = panel.querySelectorAll(".booking-main-pane");

    // City labels for known airport codes (used to restore the From/To text).
    const airportCity = {
        IST: "İstanbul", SAW: "İstanbul", FCO: "Roma", CIA: "Roma",
        CDG: "Paris", LHR: "Londra", AMS: "Amsterdam", FRA: "Frankfurt",
        MUC: "Münih", BCN: "Barselona", MAD: "Madrid", VIE: "Viyana",
        ATH: "Atina", DXB: "Dubai", JFK: "New York", ESB: "Ankara",
        ADB: "İzmir", AYT: "Antalya"
    };

    function parseAirportCode(value) {
        const match = String(value || "").match(/\(([A-Za-z]{3})\)/);
        const trimmed = String(value || "").trim();
        return match ? match[1].toUpperCase() :
            (/^[A-Za-z]{3}$/.test(trimmed) ? trimmed.toUpperCase() : trimmed);
    }


    // =================================================
    // AIRPORT AUTOCOMPLETE (From / To)
    // The input shows a readable name. The real identity is the IATA code
    // kept in selectedFromAirport / selectedToAirport. Typed text alone is
    // never a valid selection.
    // =================================================

    const fromMenu = byId("fromMenu");
    const toMenu = byId("toMenu");
    const searchError = byId("searchError");

    let selectedFromAirport = null;
    let selectedToAirport = null;

    function airportToLabel(airport) {
        return airport.name + " (" + airport.code + ")";
    }

    // Builds a selection when only the code is known (markup defaults, old storage).
    function airportFromCode(code) {
        if (!/^[A-Z]{3}$/.test(code || "")) {
            return null;
        }

        const city = airportCity[code];

        return { code: code, name: city || code, city: city || "", description: "" };
    }

    function showSearchError(message) {
        if (!searchError) return;
        searchError.textContent = message;
        searchError.hidden = false;
    }

    function hideSearchError() {
        if (!searchError) return;
        searchError.textContent = "";
        searchError.hidden = true;
    }

    function setupAirportAutocomplete(input, menu, onSelect) {
        if (!input || !menu) {
            return;
        }

        let items = [];
        let activeIndex = -1;
        let debounceTimer = null;
        let requestCounter = 0;

        function closeMenu() {
            menu.hidden = true;
            menu.innerHTML = "";
            items = [];
            activeIndex = -1;
        }

        function showNote(text) {
            menu.innerHTML = '<div class="airport-menu-note">' + text + '</div>';
            menu.hidden = false;
        }

        function escapeHtml(text) {
            const div = document.createElement("div");
            div.textContent = text || "";
            return div.innerHTML;
        }

        function renderItems() {
            let html = "";

            items.forEach(function (airport, index) {
                const meta = [airport.city, airport.description].filter(Boolean).join(" · ");

                html +=
                    '<button type="button" class="airport-option" data-index="' + index + '">' +
                        '<span>' +
                            '<span class="airport-option-name">' + escapeHtml(airport.name) + '</span>' +
                            '<span class="airport-option-meta">' + escapeHtml(meta) + '</span>' +
                        '</span>' +
                        '<span class="airport-code">' + escapeHtml(airport.code) + '</span>' +
                    '</button>';
            });

            menu.innerHTML = html;
            menu.hidden = false;
            activeIndex = -1;
        }

        function highlightActive() {
            const buttons = menu.querySelectorAll(".airport-option");

            buttons.forEach(function (button, index) {
                button.classList.toggle("is-active", index === activeIndex);
            });

            if (buttons[activeIndex]) {
                buttons[activeIndex].scrollIntoView({ block: "nearest" });
            }
        }

        function selectIndex(index) {
            const airport = items[index];

            if (!airport) {
                return;
            }

            input.value = airportToLabel(airport);
            input.classList.remove("invalid");
            onSelect(airport);
            closeMenu();
            publishDraftSearchState();
        }

        async function searchAirports(query) {
            const myRequest = ++requestCounter;

            showNote("Aranıyor...");

            try {
                const response = await fetch(
                    "/api/RapidApiFlights/airports?query=" + encodeURIComponent(query)
                );

                if (!response.ok) {
                    throw new Error("HTTP " + response.status);
                }

                const data = await response.json();

                // A newer request was started while this one was running; ignore this answer.
                if (myRequest !== requestCounter) {
                    return;
                }

                items = data;

                if (items.length === 0) {
                    showNote("Sonuç bulunamadı.");
                    return;
                }

                renderItems();
            } catch (error) {
                if (myRequest !== requestCounter) {
                    return;
                }

                showNote("Havalimanları alınamadı.");
            }
        }

        input.addEventListener("input", function () {
            // Typing changes the text, so the old selection is no longer valid.
            onSelect(null);
            input.classList.remove("invalid");
            hideSearchError();

            clearTimeout(debounceTimer);

            const query = input.value.trim();

            if (query.length < 2) {
                closeMenu();
                return;
            }

            // Wait 300 ms after the last keystroke before asking the backend.
            debounceTimer = setTimeout(function () {
                searchAirports(query);
            }, 300);
        });

        input.addEventListener("keydown", function (event) {
            if (menu.hidden || items.length === 0) {
                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                activeIndex = Math.min(activeIndex + 1, items.length - 1);
                highlightActive();
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                highlightActive();
            } else if (event.key === "Enter") {
                event.preventDefault();
                selectIndex(activeIndex >= 0 ? activeIndex : 0);
            } else if (event.key === "Escape") {
                closeMenu();
            }
        });

        menu.addEventListener("click", function (event) {
            const option = event.target.closest(".airport-option");

            if (option) {
                selectIndex(Number(option.dataset.index));
            }
        });

        document.addEventListener("click", function (event) {
            if (!input.contains(event.target) && !menu.contains(event.target)) {
                closeMenu();
            }
        });
    }

    setupAirportAutocomplete(fromInput, fromMenu, function (airport) {
        selectedFromAirport = airport;
    });

    setupAirportAutocomplete(toInput, toMenu, function (airport) {
        selectedToAirport = airport;
    });

    function getCurrentDraftSearchState() {
        const activeTrip = panel.querySelector(".trip-tab.active");
        const tripType = activeTrip && activeTrip.dataset.trip === "oneway"
            ? "oneWay"
            : "roundTrip";

        return {
            from: selectedFromAirport ? selectedFromAirport.code : "",
            fromName: selectedFromAirport ? selectedFromAirport.name : "",
            to: selectedToAirport ? selectedToAirport.code : "",
            toName: selectedToAirport ? selectedToAirport.name : "",
            departureDate: departInput ? departInput.value : "",
            returnDate: tripType === "roundTrip" && returnInput
                ? returnInput.value
                : "",
            tripType: tripType,
            adults: pax.adults,
            children: pax.children,
            infants: pax.infants,
            totalPassengers: pax.adults + pax.children + pax.infants,
            chargeablePassengers: pax.adults + pax.children,
            cabin: cabinSelect ? cabinSelect.value : "Economy"
        };
    }

    function publishDraftSearchState() {
        document.dispatchEvent(new CustomEvent("flySearchPanel:draftchange", {
            detail: getCurrentDraftSearchState()
        }));
    }


    // =================================================
    // MAIN TABS (flight-search / my-trips / check-in / status)
    // =================================================

    mainTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.panel;

            mainTabs.forEach((t) => t.classList.remove("active"));
            mainPanes.forEach((p) => p.classList.remove("active"));

            tab.classList.add("active");

            const targetPane = panel.querySelector(
                '.booking-main-pane[data-content="' + target + '"]'
            );

            if (targetPane) {
                targetPane.classList.add("active");
            }
        });
    });


    // =================================================
    // DATES (min today, default depart today)
    // =================================================

    const todayIso = new Date().toISOString().split("T")[0];

    if (departInput) {
        departInput.min = todayIso;
        if (!departInput.value) {
            departInput.value = todayIso;
        }
    }

    if (returnInput) {
        returnInput.min = todayIso;
    }


    // =================================================
    // TRIP TYPE TABS (round / one way)
    // =================================================

    function applyOneWayState(isOneWay) {
        if (!returnInput) {
            return;
        }

        returnInput.disabled = isOneWay;
        returnInput.classList.remove("invalid");

        if (isOneWay) {
            returnInput.value = "";
        }
    }

    tripTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tripTabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            applyOneWayState(tab.dataset.trip === "oneway");
            publishDraftSearchState();
        });
    });


    // =================================================
    // SWAP FROM / TO
    // =================================================

    if (swapBtn && fromInput && toInput) {
        swapBtn.addEventListener("click", () => {
            const tempText = fromInput.value;
            fromInput.value = toInput.value;
            toInput.value = tempText;

            const tempAirport = selectedFromAirport;
            selectedFromAirport = selectedToAirport;
            selectedToAirport = tempAirport;

            hideSearchError();
            publishDraftSearchState();
        });
    }


    // =================================================
    // PASSENGERS + CABIN
    // =================================================

    const pax = { adults: 1, children: 0, infants: 0 };
    const limits = { adults: [1, 9], children: [0, 8], infants: [0, 4] };

    function refreshPax() {
        const a = byId("adultsCount");
        const c = byId("childrenCount");
        const i = byId("infantsCount");

        if (a) a.textContent = pax.adults;
        if (c) c.textContent = pax.children;
        if (i) i.textContent = pax.infants;

        stepButtons.forEach((btn) => {
            const key = btn.dataset.pax;
            const dir = Number(btn.dataset.dir);
            const range = limits[key] || [0, 9];

            btn.disabled =
                (dir === -1 && pax[key] <= range[0]) ||
                (dir === 1 && pax[key] >= range[1]);
        });

        const total = pax.adults + pax.children + pax.infants;
        const word = total === 1 ? "traveller" : "travellers";
        const summary = byId("paxSummary");

        if (summary && cabinSelect) {
            summary.textContent = total + " " + word + ", " + cabinSelect.value;
        }
    }

    stepButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.pax;
            const dir = Number(btn.dataset.dir);
            const range = limits[key] || [0, 9];
            const next = pax[key] + dir;

            if (next < range[0] || next > range[1]) {
                return;
            }

            pax[key] = next;
            refreshPax();
            publishDraftSearchState();
        });
    });

    if (cabinSelect) {
        cabinSelect.addEventListener("change", () => {
            refreshPax();
            publishDraftSearchState();
        });
    }

    [fromInput, toInput].forEach((input) => {
        if (input) input.addEventListener("input", publishDraftSearchState);
    });

    [departInput, returnInput].forEach((input) => {
        if (input) input.addEventListener("change", publishDraftSearchState);
    });


    // =================================================
    // RESTORE FROM sessionStorage (searchData / passengerSelection)
    // =================================================

    function restore() {
        let searchData = null;
        let passengerSelection = null;

        try {
            searchData = JSON.parse(sessionStorage.getItem("searchData"));
        } catch {
            searchData = null;
        }

        try {
            passengerSelection = JSON.parse(
                sessionStorage.getItem("passengerSelection")
            );
        } catch {
            passengerSelection = null;
        }

        if (searchData) {
            if (fromInput && searchData.from) {
                selectedFromAirport = {
                    code: searchData.from,
                    name: searchData.fromName || airportCity[searchData.from] || searchData.from,
                    city: "",
                    description: ""
                };
                fromInput.value = airportToLabel(selectedFromAirport);
            }

            if (toInput && searchData.to) {
                selectedToAirport = {
                    code: searchData.to,
                    name: searchData.toName || airportCity[searchData.to] || searchData.to,
                    city: "",
                    description: ""
                };
                toInput.value = airportToLabel(selectedToAirport);
            }

            if (departInput && searchData.departureDate) {
                departInput.value = searchData.departureDate;
            }

            if (returnInput && searchData.returnDate) {
                returnInput.value = searchData.returnDate;
            }

        } else {
            // First visit: the markup defaults like "İstanbul (IST)" become real selections.
            selectedFromAirport = airportFromCode(parseAirportCode(fromInput ? fromInput.value : ""));
            selectedToAirport = airportFromCode(parseAirportCode(toInput ? toInput.value : ""));
        }

        const restoredTrip = (searchData && searchData.tripType) ||
            sessionStorage.getItem("tripType") || "roundTrip";
        const tabKey = restoredTrip === "oneWay" ? "oneway" : "round";
        tripTabs.forEach((t) => {
            t.classList.toggle("active", t.dataset.trip === tabKey);
        });
        applyOneWayState(restoredTrip === "oneWay");

        const restoredCabin = (searchData && searchData.cabin) ||
            (passengerSelection && passengerSelection.cabin);
        if (cabinSelect && restoredCabin) {
            cabinSelect.value = restoredCabin;
        }

        if (passengerSelection) {
            Object.keys(pax).forEach((key) => {
                const value = Math.trunc(Number(passengerSelection[key]));
                pax[key] = Number.isFinite(value)
                    ? Math.max(limits[key][0], Math.min(limits[key][1], value))
                    : limits[key][0];
            });
        }

        refreshPax();
        publishDraftSearchState();
    }

    restore();


    // =================================================
    // RUN SEARCH (resets stale booking state, then navigates)
    // =================================================

    function runSearch(fromValue, toValue) {
        if (!fromInput || !toInput) {
            return;
        }

        // Values passed in (e.g. popular route cards) count only if they carry a code;
        // free text opens the suggestion list so the user can pick a real airport.
        if (fromValue) {
            fromInput.value = fromValue;
            selectedFromAirport = airportFromCode(parseAirportCode(fromValue));
            if (!selectedFromAirport) fromInput.dispatchEvent(new Event("input"));
        }

        if (toValue) {
            toInput.value = toValue;
            selectedToAirport = airportFromCode(parseAirportCode(toValue));
            if (!selectedToAirport) toInput.dispatchEvent(new Event("input"));
        }

        publishDraftSearchState();
        hideSearchError();

        const badFrom = !selectedFromAirport;
        const badTo = !selectedToAirport;
        const sameAirport = !badFrom && !badTo && selectedFromAirport.code === selectedToAirport.code;
        const badDate = !departInput || !departInput.value;

        fromInput.classList.toggle("invalid", badFrom || sameAirport);
        toInput.classList.toggle("invalid", badTo || sameAirport);
        if (departInput) departInput.classList.toggle("invalid", badDate);

        if (badFrom) {
            showSearchError("Lütfen listeden geçerli bir kalkış havalimanı seçin.");
            return;
        }

        if (badTo) {
            showSearchError("Lütfen listeden geçerli bir varış havalimanı seçin.");
            return;
        }

        if (sameAirport) {
            showSearchError("Kalkış ve varış havalimanı aynı olamaz.");
            return;
        }

        if (badDate) {
            return;
        }

        const draftSearchState = getCurrentDraftSearchState();
        const tripType = draftSearchState.tripType;

        // Round Trip requires a return date on or after the departure date.
        if (tripType === "roundTrip") {
            const departureValue = departInput ? departInput.value : "";
            const returnValue = returnInput ? returnInput.value : "";

            const badReturn =
                !returnValue ||
                (departureValue && returnValue < departureValue);

            if (returnInput) returnInput.classList.toggle("invalid", badReturn);

            if (badReturn) {
                return;
            }
        }

        const passengerSelection = {
            adults: draftSearchState.adults,
            children: draftSearchState.children,
            infants: draftSearchState.infants,
            totalPassengers: draftSearchState.totalPassengers,
            chargeablePassengers: draftSearchState.chargeablePassengers,
            cabin: draftSearchState.cabin
        };

        const searchData = {
            from: draftSearchState.from,          // IATA code -> backend / RapidAPI
            fromName: draftSearchState.fromName,  // readable label -> UI only
            to: draftSearchState.to,
            toName: draftSearchState.toName,
            departureDate: draftSearchState.departureDate,
            returnDate: draftSearchState.returnDate,
            cabin: draftSearchState.cabin,
            tripType: tripType
        };

        // A NEW search invalidates any previous booking selections/state so
        // the old flight/passenger/baggage data cannot leak into the new search.
        // Never use sessionStorage.clear(); only the booking keys are removed.
        [
            "selectedDepartureFlight",
            "selectedReturnFlight",
            "passengerInfo",
            "baggageSelection",
            "bookingPriceSummary",
            "reservationResult"
        ].forEach((key) => sessionStorage.removeItem(key));

        sessionStorage.setItem(
            "passengerSelection",
            JSON.stringify(passengerSelection)
        );
        sessionStorage.setItem("tripType", tripType);
        sessionStorage.setItem("searchData", JSON.stringify(searchData));

        // Round Trip always restarts from the departure step.
        const stepPart = tripType === "roundTrip" ? "&step=departure" : "";

        window.location.href =
            "/Flights/SearchResults?tripType=" +
            encodeURIComponent(tripType) +
            stepPart;
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", () => runSearch());
    }

    // Exposed so Home's popular-route cards can trigger a search.
    window.flySearchPanel = { runSearch: runSearch };

})();
