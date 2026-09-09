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

    function codeToDisplay(code) {
        const city = airportCity[code];
        return city ? city + " (" + code + ")" : (code || "");
    }

    function parseAirportCode(value) {
        const match = String(value || "").match(/\(([A-Za-z]{3})\)/);
        const trimmed = String(value || "").trim();
        return match ? match[1].toUpperCase() :
            (/^[A-Za-z]{3}$/.test(trimmed) ? trimmed.toUpperCase() : trimmed);
    }

    function getCurrentDraftSearchState() {
        const activeTrip = panel.querySelector(".trip-tab.active");
        const tripType = activeTrip && activeTrip.dataset.trip === "oneway"
            ? "oneWay"
            : "roundTrip";

        return {
            from: parseAirportCode(fromInput ? fromInput.value : ""),
            to: parseAirportCode(toInput ? toInput.value : ""),
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
            const temp = fromInput.value;
            fromInput.value = toInput.value;
            toInput.value = temp;
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
                fromInput.value = codeToDisplay(searchData.from);
            }

            if (toInput && searchData.to) {
                toInput.value = codeToDisplay(searchData.to);
            }

            if (departInput && searchData.departureDate) {
                departInput.value = searchData.departureDate;
            }

            if (returnInput && searchData.returnDate) {
                returnInput.value = searchData.returnDate;
            }

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

        if (fromValue) fromInput.value = fromValue;
        if (toValue) toInput.value = toValue;
        publishDraftSearchState();

        const badFrom = !fromInput.value.trim();
        const badTo = !toInput.value.trim();
        const badDate = !departInput || !departInput.value;

        fromInput.classList.toggle("invalid", badFrom);
        toInput.classList.toggle("invalid", badTo);
        if (departInput) departInput.classList.toggle("invalid", badDate);

        if (badFrom || badTo || badDate) {
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
            from: draftSearchState.from,
            to: draftSearchState.to,
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
