// ========================
// PAGE DATA
// ========================

const baggageUrlParams = new URLSearchParams(window.location.search);

const baggageTripType =
    baggageUrlParams.get("tripType") ||
    sessionStorage.getItem("tripType") ||
    "oneWay";

const baggageDepartureFlight =
    getBaggageStorage("selectedDepartureFlight");

const baggageReturnFlight =
    getBaggageStorage("selectedReturnFlight");

const savedBaggageSelection =
    getBaggageStorage("baggageSelection");


// ========================
// ELEMENTS
// ========================

const cabinInputs =
    document.querySelectorAll('input[name="cabinBaggage"]');

const checkedInputs =
    document.querySelectorAll('input[name="checkedBaggage"]');

const baggageBackBtn =
    document.querySelector("#baggageBackBtn");

const baggageContinueBtn =
    document.querySelector("#baggageContinueBtn");


// ========================
// HELPERS
// ========================

function getBaggageStorage(key) {
    const value = sessionStorage.getItem(key);

    if (!value) return null;

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function getBaggagePrice(value) {
    if (typeof value === "number") {
        return value;
    }

    if (!value) {
        return 0;
    }

    let normalized = String(value)
        .replace(/[^\d.,]/g, "")
        .trim();

    if (normalized.includes(".") && normalized.includes(",")) {
        normalized = normalized
            .replace(/\./g, "")
            .replace(",", ".");
    } else if (normalized.includes(",")) {
        normalized = normalized.replace(",", ".");
    } else {
        const parts = normalized.split(".");

        if (parts.length === 2 && parts[1].length === 3) {
            normalized = parts.join("");
        }
    }

    const price = Number(normalized);

    return Number.isFinite(price) ? price : 0;
}

function formatBaggagePrice(price) {
    return new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price) + " TL";
}

function setBaggageText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
        element.textContent = value;
    }
}


// ========================
// SELECTED STYLES
// ========================

function updateBaggageSelectedStyles() {
    document
        .querySelectorAll(".baggage-option")
        .forEach(option => {
            const input = option.querySelector("input");

            option.classList.toggle(
                "selected",
                input?.checked === true
            );
        });

    document
        .querySelectorAll(".checked-baggage-option")
        .forEach(option => {
            const input = option.querySelector("input");

            option.classList.toggle(
                "selected",
                input?.checked === true
            );
        });
}


// ========================
// CABIN BAGGAGE
// ========================

function getSelectedCabinBaggage() {
    const input = document.querySelector(
        'input[name="cabinBaggage"]:checked'
    );

    if (!input) {
        return {
            type: "personal",
            name: "Kişisel Eşya",
            kg: 0,
            price: 0
        };
    }

    return {
        type: input.value,
        name: input.dataset.name,
        kg: Number(input.dataset.kg) || 0,
        price: Number(input.dataset.price) || 0
    };
}


// ========================
// CHECKED BAGGAGE
// ========================

function getSelectedCheckedBaggage() {
    const input = document.querySelector(
        'input[name="checkedBaggage"]:checked'
    );

    if (!input) {
        return {
            name: "Ek bagaj yok",
            kg: 0,
            price: 0
        };
    }

    return {
        name: input.dataset.name,
        kg: Number(input.dataset.kg) || 0,
        price: Number(input.dataset.price) || 0
    };
}


// ========================
// SAVE BAGGAGE
// ========================

function saveBaggageSelection() {
    const cabinBaggage =
        getSelectedCabinBaggage();

    const checkedBaggage =
        getSelectedCheckedBaggage();

    const baggageSelection = {
        cabinBaggage,
        checkedBaggage,
        totalBaggagePrice:
            cabinBaggage.price +
            checkedBaggage.price
    };

    sessionStorage.setItem(
        "baggageSelection",
        JSON.stringify(baggageSelection)
    );

    return baggageSelection;
}


// ========================
// PRICE SUMMARY
// ========================

function updateBaggagePriceSummary() {
    const baggageSelection = saveBaggageSelection();

    const departurePrice =
        getBaggagePrice(baggageDepartureFlight?.price);

    const returnPrice =
        baggageTripType === "roundTrip"
            ? getBaggagePrice(baggageReturnFlight?.price)
            : 0;

    const cabinBaggagePrice =
        baggageSelection.cabinBaggage?.price || 0;

    const checkedBaggagePrice =
        baggageSelection.checkedBaggage?.price || 0;

    const baggagePrice =
        cabinBaggagePrice + checkedBaggagePrice;

    const totalPrice =
        departurePrice +
        returnPrice +
        baggagePrice;

    setBaggageText(
        "#flowDeparturePrice",
        formatBaggagePrice(departurePrice)
    );

    setBaggageText(
        "#flowCabinBaggagePrice",
        formatBaggagePrice(cabinBaggagePrice)
    );

    setBaggageText(
        "#flowCheckedBaggagePrice",
        formatBaggagePrice(checkedBaggagePrice)
    );

    setBaggageText(
        "#flowTotalPrice",
        formatBaggagePrice(totalPrice)
    );

    const returnPriceRow =
        document.querySelector("#flowReturnPriceRow");

    if (
        baggageTripType === "roundTrip" &&
        baggageReturnFlight
    ) {
        returnPriceRow?.classList.remove("d-none");

        setBaggageText(
            "#flowReturnPrice",
            formatBaggagePrice(returnPrice)
        );
    } else {
        returnPriceRow?.classList.add("d-none");
    }

    const bookingPriceSummary = {
        departureFlightPrice: departurePrice,
        returnFlightPrice: returnPrice,
        cabinBaggagePrice: cabinBaggagePrice,
        checkedBaggagePrice: checkedBaggagePrice,
        baggagePrice: baggagePrice,
        totalPrice: totalPrice
    };

    sessionStorage.setItem(
        "bookingPriceSummary",
        JSON.stringify(bookingPriceSummary)
    );
}


// ========================
// RESTORE SELECTION
// ========================

function restoreBaggageSelection() {
    if (!savedBaggageSelection) {
        return;
    }

    const cabinType =
        savedBaggageSelection
            .cabinBaggage
            ?.type;

    const checkedKg =
        savedBaggageSelection
            .checkedBaggage
            ?.kg;

    if (cabinType) {
        const cabinInput =
            document.querySelector(
                `input[name="cabinBaggage"][value="${cabinType}"]`
            );

        if (cabinInput) {
            cabinInput.checked = true;
        }
    }

    if (
        checkedKg !== undefined &&
        checkedKg !== null
    ) {
        const checkedInput =
            document.querySelector(
                `input[name="checkedBaggage"][value="${checkedKg}"]`
            );

        if (checkedInput) {
            checkedInput.checked = true;
        }
    }
}


// ========================
// CABIN EVENTS
// ========================

cabinInputs.forEach(input => {
    input.addEventListener("change", () => {
        updateBaggageSelectedStyles();
        updateBaggagePriceSummary();
    });
});


// ========================
// CHECKED BAGGAGE EVENTS
// ========================

checkedInputs.forEach(input => {
    input.addEventListener("change", () => {
        updateBaggageSelectedStyles();
        updateBaggagePriceSummary();
    });
});


// ========================
// BACK BUTTON
// ========================

if (baggageBackBtn) {
    baggageBackBtn.addEventListener("click", () => {
        const flightId =
            baggageDepartureFlight?.id || "";

        window.location.href =
            "/Flights/PassengerInfo" +
            "?flightId=" +
            encodeURIComponent(flightId) +
            "&tripType=" +
            encodeURIComponent(baggageTripType);
    });
}


// ========================
// CONTINUE BUTTON
// ========================

if (baggageContinueBtn) {
    baggageContinueBtn.addEventListener("click", () => {
        updateBaggagePriceSummary();

        sessionStorage.setItem(
            "tripType",
            baggageTripType
        );

        window.location.href =
            "/Flights/Confirmation" +
            "?tripType=" +
            encodeURIComponent(baggageTripType);
    });
}


// ========================
// INITIALIZE
// ========================

restoreBaggageSelection();
updateBaggageSelectedStyles();
updateBaggagePriceSummary();