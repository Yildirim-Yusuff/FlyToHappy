// ========================
// BOOKING FLOW DATA
// ========================

const bookingUrlParams = new URLSearchParams(window.location.search);

const bookingTripType =
    bookingUrlParams.get("tripType") ||
    sessionStorage.getItem("tripType") ||
    "oneWay";

const bookingDepartureFlight = getBookingStorage("selectedDepartureFlight");
const bookingReturnFlight = getBookingStorage("selectedReturnFlight");
const bookingBaggageSelection = getBookingStorage("baggageSelection");
const bookingSearchData = getBookingStorage("searchData");

const bookingAirports = {
    IST: "İstanbul Havalimanı",
    SAW: "Sabiha Gökçen Havalimanı",
    FCO: "Roma Fiumicino Havalimanı",
    CIA: "Roma Ciampino Havalimanı"
};

const bookingAirlineMarks = {
    TK: {
        src: "/images/airlines/tk-mark.png",
        name: "Turkish Airlines"
    },
    PC: {
        src: "/images/airlines/pc-mark.png",
        name: "Pegasus"
    },
    VF: {
        src: "/images/airlines/vf-mark.png",
        name: "AJet"
    }
};


// ========================
// HELPERS
// ========================

function getBookingStorage(key) {
    const value = sessionStorage.getItem(key);

    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function setBookingText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
        element.textContent = value;
    }
}

// Render an airport line as: IATA code (large/bold) + full name.
// `name` is the real provider airport name saved with the selected flight; when there is none
// and the old demo map has no entry either, only the code is shown (no "ASR — ASR").
function setBookingAirport(selector, code, name) {
    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    const airportCode = String(code || "").toUpperCase();
    const airportName = getBookingAirportName(airportCode, name);

    element.innerHTML = '<span class="airport-iata">' + airportCode + '</span>';

    if (airportName) {
        const nameElement = document.createElement("span");
        nameElement.className = "airport-name";
        nameElement.textContent = " \u2014 " + airportName;
        element.appendChild(nameElement);
    }
}

function getBookingAirportName(code, name) {
    return name || bookingAirports[code] || "";
}

function getBookingAirlineCode(flight) {
    if (!flight) {
        return "--";
    }

    if (flight.airlineCode) {
        return flight.airlineCode;
    }

    if (flight.flightNumber) {
        return String(flight.flightNumber)
            .substring(0, 2)
            .toUpperCase();
    }

    return "--";
}

function setBookingAirlineMark(selector, flight) {
    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    const airlineCode = String(getBookingAirlineCode(flight)).toUpperCase();
    const airlineMark = bookingAirlineMarks[airlineCode];

    if (!airlineMark) {
        element.textContent = airlineCode;
        return;
    }

    const image = document.createElement("img");
    image.src = airlineMark.src;
    image.alt = (flight.airline || airlineMark.name) + " logosu";
    element.replaceChildren(image);
}

function getBookingPrice(value) {
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
    }

    const price = Number(normalized);

    return Number.isFinite(price) ? price : 0;
}

function formatBookingPrice(price) {
    return new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price) + " TL";
}


// ========================
// DEPARTURE FLIGHT
// ========================

function renderBookingDepartureFlight() {
    if (!bookingDepartureFlight) {
        return;
    }

    const flight = bookingDepartureFlight;

    setBookingAirlineMark(
        "#departureAirlineCode",
        flight
    );

    setBookingText(
        "#summaryAirline",
        flight.airline || "Havayolu"
    );

    setBookingText(
        "#summaryFlightNumber",
        flight.flightNumber || ""
    );

    setBookingText(
        "#summaryDepartureTime",
        flight.departureTime || "--:--"
    );

    setBookingText(
        "#summaryArrivalTime",
        flight.arrivalTime || "--:--"
    );

    setBookingAirport(
        "#summaryDepartureAirport",
        flight.departureAirport || flight.from,
        flight.departureAirportName
    );

    setBookingAirport(
        "#summaryArrivalAirport",
        flight.arrivalAirport || flight.to,
        flight.arrivalAirportName
    );

    setBookingText(
        "#summaryCabin",
        flight.cabin || "Ekonomi"
    );

    setBookingText(
        "#summaryDuration",
        flight.duration || ""
    );
}


// ========================
// RETURN FLIGHT
// ========================

function renderBookingReturnFlight() {
    const returnFlightCard =
        document.querySelector(".return-flight-card");

    if (
        bookingTripType !== "roundTrip" ||
        !bookingReturnFlight
    ) {
        returnFlightCard?.classList.add("d-none");
        return;
    }

    returnFlightCard?.classList.remove("d-none");

    const flight = bookingReturnFlight;

    setBookingAirlineMark(
        "#returnAirlineCode",
        flight
    );

    setBookingText(
        "#returnSummaryAirline",
        flight.airline || "Havayolu"
    );

    setBookingText(
        "#returnSummaryFlightNumber",
        flight.flightNumber || ""
    );

    setBookingText(
        "#returnSummaryDepartureTime",
        flight.departureTime || "--:--"
    );

    setBookingText(
        "#returnSummaryArrivalTime",
        flight.arrivalTime || "--:--"
    );

    setBookingAirport(
        "#returnSummaryDepartureAirport",
        flight.departureAirport || flight.from,
        flight.departureAirportName
    );

    setBookingAirport(
        "#returnSummaryArrivalAirport",
        flight.arrivalAirport || flight.to,
        flight.arrivalAirportName
    );

    setBookingText(
        "#returnSummaryCabin",
        flight.cabin || "Ekonomi"
    );

    setBookingText(
        "#returnSummaryDuration",
        flight.duration || ""
    );
}


// ========================
// PRICE SUMMARY
// ========================

function renderBookingPriceSummary() {
    const departurePrice =
        getBookingPrice(bookingDepartureFlight?.price);

    const returnPrice =
        bookingTripType === "roundTrip"
            ? getBookingPrice(bookingReturnFlight?.price)
            : 0;

    const cabinBaggagePrice =
        Number(
            bookingBaggageSelection?.cabinBaggage?.price
        ) || 0;

    const checkedBaggagePrice =
        Number(
            bookingBaggageSelection?.checkedBaggage?.price
        ) || 0;

    const baggagePrice =
        cabinBaggagePrice + checkedBaggagePrice;

    const totalPrice =
        departurePrice +
        returnPrice +
        baggagePrice;

    setBookingText(
        "#flowDeparturePrice",
        formatBookingPrice(departurePrice)
    );

    setBookingText(
        "#flowCabinBaggagePrice",
        formatBookingPrice(cabinBaggagePrice)
    );

    setBookingText(
        "#flowCheckedBaggagePrice",
        formatBookingPrice(checkedBaggagePrice)
    );

    setBookingText(
        "#flowTotalPrice",
        formatBookingPrice(totalPrice)
    );

    const returnPriceRow =
        document.querySelector("#flowReturnPriceRow");

    if (
        bookingTripType === "roundTrip" &&
        bookingReturnFlight
    ) {
        returnPriceRow?.classList.remove("d-none");

        setBookingText(
            "#flowReturnPrice",
            formatBookingPrice(returnPrice)
        );
    } else {
        returnPriceRow?.classList.add("d-none");
    }
}


// ========================
// SEARCH DATA (dates & cabin)
// ========================

// Format a "YYYY-MM-DD" value into e.g. "10 Haz 2026, Çarşamba".
function formatBookingDate(value) {
    if (!value) {
        return "";
    }

    const parts = String(value).split("-");

    if (parts.length !== 3) {
        return "";
    }

    const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    if (isNaN(date.getTime())) {
        return "";
    }

    const datePart = new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);

    // Turkish weekday names indexed by Date.getDay() (0 = Sunday).
    // Using an explicit map avoids depending on the browser Intl locale
    // data, which returned the weekday in English on some browsers.
    const turkishWeekdays = [
        "Pazar",
        "Pazartesi",
        "Salı",
        "Çarşamba",
        "Perşembe",
        "Cuma",
        "Cumartesi"
    ];

    const weekday = turkishWeekdays[date.getDay()];

    return datePart + ", " + weekday;
}

// Fill the sidebar dates and cabin from the search context saved on Home.
function renderBookingDates() {
    if (!bookingSearchData) {
        return;
    }

    const departureDateText =
        formatBookingDate(bookingSearchData.departureDate);

    if (departureDateText) {
        setBookingText("#summaryDepartureDate", departureDateText);
        setBookingText("#summaryArrivalDate", departureDateText);
    }

    if (bookingTripType === "roundTrip") {
        const returnDateText =
            formatBookingDate(bookingSearchData.returnDate);

        if (returnDateText) {
            setBookingText("#returnSummaryDepartureDate", returnDateText);
            setBookingText("#returnSummaryArrivalDate", returnDateText);
        }
    }

    if (bookingSearchData.cabin) {
        setBookingText("#summaryCabin", bookingSearchData.cabin);
        setBookingText("#returnSummaryCabin", bookingSearchData.cabin);
    }
}


// ========================
// INITIALIZE
// ========================

renderBookingDepartureFlight();
renderBookingReturnFlight();
renderBookingPriceSummary();
renderBookingDates();
