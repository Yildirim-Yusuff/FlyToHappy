// =====================================================
// SELECTED FLIGHT
// =====================================================

let selectedFlightForBooking = null;

function readSearchObject(key) {
    try {
        const value = JSON.parse(sessionStorage.getItem(key));
        return value && typeof value === "object" ? value : null;
    } catch {
        return null;
    }
}

const searchContext = readSearchObject("searchData");
const passengerSelection =
    readSearchObject("passengerSelection") || {
        adults: 1,
        children: 0,
        infants: 0,
        chargeablePassengers: 1
    };

const chargeablePassengers =
    Number(passengerSelection.chargeablePassengers) || 1;

function getTotalFlightPrice(flight) {
    return flight.price * chargeablePassengers;
}

// =====================================================
// AIRPORTS
// =====================================================

const airports = {
    IST: "İstanbul Havalimanı",
    SAW: "Sabiha Gökçen Havalimanı",
    FCO: "Roma Fiumicino Havalimanı",
    CIA: "Roma Ciampino Havalimanı",
    CDG: "Paris Charles de Gaulle Havalimanı",
    LHR: "Londra Heathrow Havalimanı",
    AMS: "Amsterdam Schiphol Havalimanı",
    FRA: "Frankfurt Havalimanı",
    MUC: "Münih Havalimanı",
    BCN: "Barselona El Prat Havalimanı",
    MAD: "Madrid Barajas Havalimanı",
    VIE: "Viyana Havalimanı",
    ATH: "Atina Havalimanı",
    DXB: "Dubai Havalimanı",
    JFK: "New York John F. Kennedy Havalimanı",
    ESB: "Ankara Esenboğa Havalimanı",
    ADB: "İzmir Adnan Menderes Havalimanı",
    AYT: "Antalya Havalimanı"
};


// =====================================================
// ROUND TRIP STEP (departure / return)
// =====================================================

// Read trip type and current step from the URL.
// Fallback to sessionStorage, then to sensible defaults.
const flightSearchParams = new URLSearchParams(window.location.search);

const flightTripType =
    flightSearchParams.get("tripType") ||
    (searchContext && searchContext.tripType) ||
    sessionStorage.getItem("tripType") ||
    "oneWay";

const flightStep =
    flightSearchParams.get("step") === "return"
        ? "return"
        : "departure";

const isReturnStep =
    flightTripType === "roundTrip" &&
    flightStep === "return";

// Guard: a return flight cannot be picked before a departure flight exists.
// If someone opens the return URL directly, send them back to the departure step.
if (isReturnStep && !sessionStorage.getItem("selectedDepartureFlight")) {
    window.location.href =
        "/Flights/SearchResults?tripType=roundTrip&step=departure";
}

// =====================================================
// FLIGHT DATA SOURCE (backend -> RapidAPI)
// =====================================================

// Filled by loadFlights(). Same object shape the filters and cards already use.
let activeFlights = [];

function showFlightListMessage(title, text) {
    const flightList = document.querySelector("#flightList");

    if (!flightList) {
        return;
    }

    flightList.innerHTML = `
        <div class="sr-empty">
            <i class="bi bi-airplane-engines"></i>
            <h3>${title}</h3>
            <p>${text}</p>
        </div>
    `;
}

// Sidebar airline counts come from the loaded flights (before any filter).
// The numbers were static "(3) (4) (3)" in the view before; now they match the real result list.
function updateAirlineCounts() {
    const counts = { TK: 0, PC: 0, VF: 0 };

    activeFlights.forEach(function (flight) {
        if (counts[flight.airlineCode] !== undefined) {
            counts[flight.airlineCode] += 1;
        }
    });

    const countElements = { TK: "#airlineCountTK", PC: "#airlineCountPC", VF: "#airlineCountVF" };

    Object.keys(countElements).forEach(function (code) {
        const element = document.querySelector(countElements[code]);

        if (element) {
            element.textContent = "(" + counts[code] + ")";
        }
    });
}

async function loadFlights() {

    if (!searchContext || !searchContext.from || !searchContext.to || !searchContext.departureDate) {
        showFlightListMessage("Arama bilgisi bulunamadı", "Lütfen ana sayfadan yeniden arama yapın.");
        return;
    }

    // Departure step: from -> to on departureDate.
    // Return step: the real reverse direction, to -> from on returnDate.
    let from = searchContext.from;
    let to = searchContext.to;
    let date = searchContext.departureDate;

    if (isReturnStep) {
        from = searchContext.to;
        to = searchContext.from;
        date = searchContext.returnDate;
    }

    if (!date) {
        showFlightListMessage("Dönüş tarihi bulunamadı", "Lütfen ana sayfadan yeniden arama yapın.");
        return;
    }

    const cabin = searchContext.cabin || passengerSelection.cabin || "Economy";

    showFlightListMessage("Uçuşlar aranıyor…", "Gerçek uçuş verileri getiriliyor, lütfen bekleyin.");

    const url =
        "/api/RapidApiFlights/search" +
        "?from=" + encodeURIComponent(from) +
        "&to=" + encodeURIComponent(to) +
        "&date=" + encodeURIComponent(date) +
        "&cabin=" + encodeURIComponent(cabin);

    let flightsFromBackend;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        flightsFromBackend = await response.json();
    } catch (error) {
        showFlightListMessage("Uçuşlar yüklenemedi", "Uçuş servisine ulaşılamadı. Lütfen daha sonra tekrar deneyin.");

        if (resultCount) {
            resultCount.textContent = "0 uçuş seçeneği bulundu";
        }

        return;
    }

    // `id` is what the "Uçuşu Seç" button carries; it is the backend searchFlightId.
    activeFlights = flightsFromBackend.map(function (flight) {
        return { ...flight, id: flight.searchFlightId };
    });

    updateAirlineCounts();

    if (activeFlights.length === 0) {
        showFlightListMessage(
            "Bu rota ve tarihte uçuş bulunamadı",
            "Turkish Airlines, Pegasus veya AJet ile uygun uçuş yok. Farklı bir tarih deneyebilirsiniz."
        );

        if (resultCount) {
            resultCount.textContent = "0 uçuş seçeneği bulundu";
        }

        return;
    }

    // Real fares are outside the demo slider bounds. Widen the existing sliders to the
    // loaded data so the untouched price/duration filters keep working. The sliders'
    // own "input" listeners refresh their labels and render the list.
    if (priceRange) {
        let lowestPrice = activeFlights[0].price;
        let highestPrice = activeFlights[0].price;

        activeFlights.forEach(function (flight) {
            if (flight.price < lowestPrice) { lowestPrice = flight.price; }
            if (flight.price > highestPrice) { highestPrice = flight.price; }
        });

        priceRange.min = Math.floor(lowestPrice / 100) * 100;
        priceRange.max = Math.ceil(highestPrice / 100) * 100;
        priceRange.value = priceRange.max;
    }

    if (durationRange) {
        let longestMinutes = 0;

        activeFlights.forEach(function (flight) {
            const parts = flight.duration.match(/(\d+)\s*(?:sa|saat)(?:\s*(\d+)\s*dk)?/);
            const minutes = parts ? (Number(parts[1]) * 60) + Number(parts[2] || 0) : 0;
            if (minutes > longestMinutes) { longestMinutes = minutes; }
        });

        const neededMax = Math.ceil(longestMinutes / 10) * 10;

        if (neededMax > Number(durationRange.max)) {
            durationRange.max = neededMax;
            durationRange.value = neededMax;
            durationRange.dispatchEvent(new Event("input"));
        }
    }

    if (priceRange) {
        priceRange.dispatchEvent(new Event("input"));
    } else {
        renderFlights();
    }
}

// Derive a short city label from an airport code using the airport map
// (text before the first space). Used to build the route header dynamically.
function getCityFromAirport(code) {
    if (code === "SAW") return "İstanbul";
    if (code === "JFK") return "New York";
    const fullName = airports[code];

    if (!fullName) {
        return code || "";
    }

    return fullName.split(" ")[0];
}

// Search fields are free text; encode them before inserting card markup.
function escapeSearchText(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

// Format a "YYYY-MM-DD" value into Turkish long form, e.g. "10 Haziran 2026".
function formatSearchDate(value) {
    if (!value) {
        return "";
    }

    const parts = String(value).split("-");

    if (parts.length !== 3) {
        return value;
    }

    const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    if (isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(date);
}

// Update the SearchResults summary bar from committed data or a live panel draft.
function updateRouteHeader(draftSearchState) {
    const searchData = draftSearchState || searchContext;
    const displayReturnStep = isReturnStep &&
        (!draftSearchState || draftSearchState.tripType === "roundTrip");
    let fromCode = "—";
    let toCode = "—";
    let dateText = "";

    if (searchData) {
        fromCode = (displayReturnStep ? searchData.to : searchData.from) || "—";
        toCode = (displayReturnStep ? searchData.from : searchData.to) || "—";

        const departureText = formatSearchDate(searchData.departureDate);
        const returnText = searchData.tripType === "roundTrip"
            ? formatSearchDate(searchData.returnDate)
            : "";
        dateText = returnText
            ? departureText + " - " + returnText
            : departureText;
    }

    // searchData carries the provider city of the airports chosen in the autocomplete (fromCity / toCity).
    // The old code map is the fallback; when nothing is known the code itself is shown.
    const fromCity = (searchData && (displayReturnStep ? searchData.toCity : searchData.fromCity)) || getCityFromAirport(fromCode);
    const toCity = (searchData && (displayReturnStep ? searchData.fromCity : searchData.toCity)) || getCityFromAirport(toCode);

    // ROUTE chip
    const sumRoute = document.querySelector("#sumRoute");

    if (sumRoute) {
        // No "ASR ASR": the city text is skipped when only the code is known.
        const fromLabel = fromCity === fromCode ? "" : escapeSearchText(fromCity) + " ";
        const toLabel = toCity === toCode ? "" : escapeSearchText(toCity) + " ";

        sumRoute.innerHTML =
            fromLabel + "<b>" + escapeSearchText(fromCode) + "</b> \u2192 " +
            toLabel + "<b>" + escapeSearchText(toCode) + "</b>";
    }

    // RESULT TITLE (adds a hint on the return step)
    const resultTitle = document.querySelector("#resultTitle");

    if (resultTitle) {
        resultTitle.textContent = displayReturnStep
            ? fromCity + " - " + toCity + " Uçuşları \u00b7 Dönüş uçuşunuzu seçin"
            : fromCity + " - " + toCity + " Uçuşları";
    }

    // DATE chip
    const sumDates = document.querySelector("#sumDates");

    if (sumDates) {
        sumDates.textContent = dateText || "Tarih seçilmedi";
    }

    // CABIN chip
    const sumCabin = document.querySelector("#sumCabin");

    if (sumCabin) {
        sumCabin.textContent = (searchData && searchData.cabin) || passengerSelection.cabin || "—";
    }

    // PASSENGER chip (from passengerSelection)
    const sumPax = document.querySelector("#sumPax");

    if (sumPax) {
        const total = draftSearchState
            ? Number(draftSearchState.totalPassengers || 0)
            : Number(passengerSelection.adults || 0) +
                Number(passengerSelection.children || 0) + Number(passengerSelection.infants || 0);
        sumPax.textContent = (total || 1) + " Yolcu";
    }
}

document.addEventListener("flySearchPanel:draftchange", function (event) {
    if (event.detail) {
        updateRouteHeader(event.detail);
    }
});


// =====================================================
// PRICE FILTER
// =====================================================

const priceRange =
    document.querySelector("#priceRange");

const priceRangeValue =
    document.querySelector("#priceRangeValue");


// =====================================================
// STOP FILTERS
// =====================================================

const filterDirect =
    document.querySelector("#filterDirect");

const filterOneStop =
    document.querySelector("#filterOneStop");


// =====================================================
// AIRLINE FILTERS
// =====================================================

const filterTurkishAirlines =
    document.querySelector("#filterTurkishAirlines");

const filterPegasus =
    document.querySelector("#filterPegasus");

const filterAJet =
    document.querySelector("#filterAJet");


// =====================================================
// FILTER CLEAR BUTTON
// =====================================================

const filterClear =
    document.querySelector(".sr-filter-clear");


// =====================================================
// RESULT COUNT
// =====================================================

const resultCount =
    document.querySelector("#resultCount");


// =====================================================
// SORT
// =====================================================

const sortSelect =
    document.querySelector("#sortSelect");


// =====================================================
// MODAL
// =====================================================

const selectFlightModal =
    document.querySelector("#selectFlightModal");

const selectedFlightBody =
    document.querySelector("#selectedFlightBody");

const modalContinueBtn =
    document.querySelector(".sr-modal-continue");


// =====================================================
// DEPARTURE TIME FILTERS
// =====================================================

const filterMorning =
    document.querySelector("#filterMorning");

const filterNoon =
    document.querySelector("#filterNoon");

const filterEvening =
    document.querySelector("#filterEvening");

const filterNight =
    document.querySelector("#filterNight");


// =====================================================
// DURATION FILTER
// =====================================================

const durationRange =
    document.querySelector("#durationRange");

const durationRangeValue =
    document.querySelector("#durationRangeValue");


// =====================================================
// BAGGAGE FILTERS
// =====================================================

const filterCabinBaggage =
    document.querySelector("#filterCabinBaggage");

const filterCheckedBaggage =
    document.querySelector("#filterCheckedBaggage");


// =====================================================
// RENDER FLIGHTS
// =====================================================

function renderFlights() {

    const flightList =
        document.querySelector("#flightList");

    if (!flightList) {
        return;
    }


    // =================================================
    // BAGGAGE FILTER VALUES
    // =================================================

    const cabinBaggageSelected =
        filterCabinBaggage &&
        filterCabinBaggage.checked;

    const checkedBaggageSelected =
        filterCheckedBaggage &&
        filterCheckedBaggage.checked;


    // =================================================
    // DEPARTURE TIME FILTER VALUES
    // =================================================

    const morningSelected =
        filterMorning &&
        filterMorning.checked;

    const noonSelected =
        filterNoon &&
        filterNoon.checked;

    const eveningSelected =
        filterEvening &&
        filterEvening.checked;

    const nightSelected =
        filterNight &&
        filterNight.checked;


    // =================================================
    // PRICE FILTER VALUE
    // =================================================

    const maxPrice =
        priceRange
            ? Number(priceRange.value)
            : 3000;


    // =================================================
    // DURATION FILTER VALUE
    // =================================================

    const maxDuration =
        durationRange
            ? Number(durationRange.value)
            : 400;


    // =================================================
    // STOP FILTER VALUES
    // =================================================

    const directSelected =
        filterDirect &&
        filterDirect.checked;

    const oneStopSelected =
        filterOneStop &&
        filterOneStop.checked;


    // =================================================
    // AIRLINE FILTER VALUES
    // =================================================

    const turkishSelected =
        filterTurkishAirlines &&
        filterTurkishAirlines.checked;

    const pegasusSelected =
        filterPegasus &&
        filterPegasus.checked;

    const aJetSelected =
        filterAJet &&
        filterAJet.checked;


    // =================================================
    // FILTER FLIGHTS
    // =================================================

    const filteredFlights =
        activeFlights.filter(function (flight) {


            // =============================================
            // PRICE
            // =============================================

            const priceMatch =
                flight.price <= maxPrice;


            // =============================================
            // DURATION
            // =============================================

            const durationParts =
                flight.duration.match(
                    /(\d+)\s*(?:sa|saat)(?:\s*(\d+)\s*dk)?/
                );

            const flightDurationMinutes =
                durationParts
                    ? (Number(durationParts[1]) * 60) +
                    Number(durationParts[2] || 0)
                    : 0;

            const durationMatch =
                flightDurationMinutes <= maxDuration;


            // =============================================
            // STOPS
            // =============================================

            let stopMatch = true;

            if (
                directSelected ||
                oneStopSelected
            ) {

                stopMatch =
                    (directSelected &&
                        flight.stops === 0) ||

                    (oneStopSelected &&
                        flight.stops === 1);
            }


            // =============================================
            // AIRLINE
            // =============================================

            let airlineMatch = true;

            if (
                turkishSelected ||
                pegasusSelected ||
                aJetSelected
            ) {

                airlineMatch =
                    (
                        turkishSelected &&
                        flight.airlineCode === "TK"
                    ) ||
                    (
                        pegasusSelected &&
                        flight.airlineCode === "PC"
                    ) ||
                    (
                        aJetSelected &&
                        flight.airlineCode === "VF"
                    );
            }


            // =============================================
            // DEPARTURE TIME
            // =============================================

            let timeMatch = true;

            if (
                morningSelected ||
                noonSelected ||
                eveningSelected ||
                nightSelected
            ) {

                const departureHour =
                    Number(
                        flight.departureTime.split(":")[0]
                    );

                timeMatch =
                    (
                        morningSelected &&
                        departureHour >= 6 &&
                        departureHour < 12
                    ) ||

                    (
                        noonSelected &&
                        departureHour >= 12 &&
                        departureHour < 18
                    ) ||

                    (
                        eveningSelected &&
                        departureHour >= 18 &&
                        departureHour < 24
                    ) ||

                    (
                        nightSelected &&
                        departureHour >= 0 &&
                        departureHour < 6
                    );
            }


            // =============================================
            // BAGGAGE
            // =============================================

            let baggageMatch = true;

            if (
                cabinBaggageSelected ||
                checkedBaggageSelected
            ) {

                baggageMatch =
                    (
                        !cabinBaggageSelected ||
                        flight.cabinBaggageIncluded
                    ) &&
                    (
                        !checkedBaggageSelected ||
                        flight.checkedBaggageIncluded
                    );
            }


            return (
                priceMatch &&
                stopMatch &&
                airlineMatch &&
                timeMatch &&
                durationMatch &&
                baggageMatch
            );

        });


    // =================================================
    // RESULT COUNT
    // =================================================

    if (resultCount) {

        resultCount.textContent =
            filteredFlights.length +
            " uçuş seçeneği bulundu";
    }


    // =================================================
    // EMPTY STATE
    // =================================================

    if (filteredFlights.length === 0) {

        flightList.innerHTML = `
            <div class="sr-empty">

                <i class="bi bi-airplane-engines"></i>

                <h3>
                    Uygun uçuş bulunamadı
                </h3>

                <p>
                    Filtreleri değiştirerek daha fazla uçuş görebilirsin.
                </p>

            </div>
        `;

        return;
    }


    // =================================================
    // SORT
    // =================================================

    let sortedFlights =
        [...filteredFlights];


    if (sortSelect) {

        if (sortSelect.value === "price") {

            sortedFlights.sort(function (a, b) {
                return a.price - b.price;
            });

        }

        else if (sortSelect.value === "earliest") {

            sortedFlights.sort(function (a, b) {

                return a.departureTime.localeCompare(
                    b.departureTime
                );

            });

        }

        else if (sortSelect.value === "latest") {

            sortedFlights.sort(function (a, b) {

                return b.departureTime.localeCompare(
                    a.departureTime
                );

            });

        }

        else if (sortSelect.value === "duration") {


            function durationToMinutes(duration) {

                const hourMatch =
                    duration.match(/(\d+)\s*sa/);

                const minuteMatch =
                    duration.match(/(\d+)\s*dk/);


                const hours =
                    hourMatch
                        ? Number(hourMatch[1])
                        : 0;

                const minutes =
                    minuteMatch
                        ? Number(minuteMatch[1])
                        : 0;


                return (hours * 60) + minutes;
            }


            sortedFlights.sort(function (a, b) {

                return (
                    durationToMinutes(a.duration) -
                    durationToMinutes(b.duration)
                );

            });

        }

    }


    // =================================================
    // RENDER FLIGHT CARDS
    // =================================================

    // Airline logo file per airline code.
    const airlineLogos = {
        TK: "/images/airlines/tk.png",
        PC: "/images/airlines/pc.png",
        VF: "/images/airlines/vf.png"
    };

    // Cheapest option in the current filtered list — visual badge only.
    // Does not change flight.price, sorting, filtering or bookingPriceSummary.
    const cheapestPrice =
        Math.min.apply(null, filteredFlights.map(function (f) { return f.price; }));

    flightList.innerHTML =
        sortedFlights.map(function (flight) {


            const stopText =
                flight.stops === 0
                    ? "Direkt"
                    : flight.stops + " Aktarma";


            const priceText =
                getTotalFlightPrice(flight).toLocaleString("tr-TR") +
                " TL";


            // Real airport name from the provider (backend); the old demo map is only a fallback.
            const departureAirportName =
                flight.departureAirportName ||
                airports[flight.departureAirport] ||
                "";


            const arrivalAirportName =
                flight.arrivalAirportName ||
                airports[flight.arrivalAirport] ||
                "";


            const logoSrc =
                airlineLogos[flight.airlineCode] ||
                "";

            const isCheapest =
                flight.price === cheapestPrice;

            const routeText =
                flight.duration + " · " + stopText;


            return `
                <article class="sr-flight-card">

                    <div class="sr-flight-body">

                        <!-- HEAD: airline + tags -->
                        <div class="sr-flight-head">

                            <div class="sr-airline-logo">
                                <img src="${logoSrc}" alt="${escapeSearchText(flight.airline)}" />
                            </div>

                            <div class="sr-airline">
                                <span class="sr-airline-name">${escapeSearchText(flight.airline)}</span>
                                <span class="sr-flight-number">${escapeSearchText(flight.flightNumber)}</span>
                            </div>

                            <div class="sr-flight-tags">

                                ${flight.baggageKg > 0
                    ? `<span class="sr-tag">
                                            <i class="bi bi-luggage-fill"></i>
                                            ${flight.baggageKg} kg
                                        </span>`
                    : ``}

                                <span class="sr-tag">
                                    <i class="bi bi-briefcase"></i>
                                    ${escapeSearchText(flight.cabinClass)}
                                </span>

                                ${flight.checkedBaggageIncluded
                    ? `<span class="sr-tag">
                                            <i class="bi bi-check-circle"></i>
                                            Kayıtlı bagaj dahil
                                        </span>`
                    : `<span class="sr-tag sr-tag-warn">
                                            <i class="bi bi-x-circle"></i>
                                            Kayıtlı bagaj yok
                                        </span>`}

                            </div>

                        </div>

                        <!-- TIMES: departure - route - arrival -->
                        <div class="sr-flight-times">

                            <div class="sr-flight-time">
                                <strong>${flight.departureTime}</strong>
                                <div class="sr-flight-airport">
                                    <span class="sr-airport-code">${escapeSearchText(flight.departureAirport)}</span>
                                    <span class="sr-airport-name">${escapeSearchText(departureAirportName)}</span>
                                </div>
                            </div>

                            <div class="sr-flight-route">

                                <span class="sr-duration">${routeText}</span>

                                <div class="sr-route-line">
                                    <span class="sr-route-dot sr-route-dot--start"></span>
                                    <span class="sr-route-dash"></span>
                                    ${flight.stops > 0
                    ? `<span class="sr-route-dot sr-route-dot--stop"></span>
                                       <span class="sr-route-dash"></span>`
                    : ``}
                                    <i class="bi bi-airplane-fill"></i>
                                    <span class="sr-route-dash"></span>
                                    <span class="sr-route-dot"></span>
                                </div>

                            </div>

                            <div class="sr-flight-time sr-flight-time--arrival">
                                <strong>${flight.arrivalTime}</strong>
                                <div class="sr-flight-airport">
                                    <span class="sr-airport-name">${escapeSearchText(arrivalAirportName)}</span>
                                    <span class="sr-airport-code">${escapeSearchText(flight.arrivalAirport)}</span>
                                </div>
                            </div>

                        </div>

                    </div>

                    <!-- PRICE COLUMN -->
                    <div class="sr-flight-price ${isCheapest ? "sr-flight-price--best" : ""}">

                        <div class="sr-price-info">
                            ${isCheapest
                    ? `<span class="sr-best-badge">EN DÜŞÜK</span>`
                    : `<small>Toplam · ${chargeablePassengers} yolcu</small>`}
                            <strong>${priceText}</strong>
                        </div>

                        <button type="button"
                                class="btn sr-select-flight"
                                data-flight-id="${flight.id}">
                            Uçuşu Seç
                        </button>

                    </div>

                </article>
            `;

        }).join("");
}


// =====================================================
// PRICE RANGE
// =====================================================

if (
    priceRange &&
    priceRangeValue
) {

    priceRangeValue.textContent =
        Number(priceRange.value)
            .toLocaleString("tr-TR") +
        " TL";


    priceRange.addEventListener(
        "input",
        function () {

            const value =
                Number(priceRange.value);

            priceRangeValue.textContent =
                value.toLocaleString("tr-TR") +
                " TL";

            renderFlights();
        }
    );
}


// =====================================================
// STOP FILTERS
// =====================================================

if (filterDirect) {

    filterDirect.addEventListener(
        "change",
        renderFlights
    );

}

if (filterOneStop) {

    filterOneStop.addEventListener(
        "change",
        renderFlights
    );

}


// =====================================================
// AIRLINE FILTERS
// =====================================================

if (filterTurkishAirlines) {

    filterTurkishAirlines.addEventListener(
        "change",
        renderFlights
    );

}

if (filterPegasus) {

    filterPegasus.addEventListener(
        "change",
        renderFlights
    );

}

if (filterAJet) {

    filterAJet.addEventListener(
        "change",
        renderFlights
    );

}


// =====================================================
// CLEAR FILTERS
// =====================================================

if (filterClear) {

    filterClear.addEventListener(
        "click",
        function () {


            if (filterDirect) {
                filterDirect.checked = false;
            }


            if (filterOneStop) {
                filterOneStop.checked = false;
            }


            if (filterTurkishAirlines) {
                filterTurkishAirlines.checked = false;
            }


            if (filterPegasus) {
                filterPegasus.checked = false;
            }


            if (filterAJet) {
                filterAJet.checked = false;
            }


            if (priceRange) {
                priceRange.value =
                    priceRange.max;
            }


            if (
                priceRange &&
                priceRangeValue
            ) {

                priceRangeValue.textContent =
                    Number(priceRange.value)
                        .toLocaleString("tr-TR") +
                    " TL";
            }


            if (filterMorning) {
                filterMorning.checked = false;
            }

            if (filterNoon) {
                filterNoon.checked = false;
            }

            if (filterEvening) {
                filterEvening.checked = false;
            }

            if (filterNight) {
                filterNight.checked = false;
            }


            if (filterCabinBaggage) {
                filterCabinBaggage.checked = false;
            }

            if (filterCheckedBaggage) {
                filterCheckedBaggage.checked = false;
            }


            if (durationRange) {

                durationRange.value =
                    durationRange.max;

            }


            if (
                durationRange &&
                durationRangeValue
            ) {

                durationRangeValue.textContent =
                    "6 sa 40 dk";

            }


            renderFlights();

        }
    );

}


// =====================================================
// SORT
// =====================================================

if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        renderFlights
    );

}


// =====================================================
// FLIGHT SELECTION
// =====================================================

document.addEventListener(
    "click",
    function (event) {


        const selectButton =
            event.target.closest(
                ".sr-select-flight"
            );


        if (!selectButton) {
            return;
        }


        const flightId =
            selectButton.dataset.flightId;


        const selectedFlight =
            activeFlights.find(function (flight) {

                return String(flight.id) === flightId;

            });


        if (!selectedFlight) {
            return;
        }


        selectedFlightForBooking = {
            ...selectedFlight,
            basePrice: selectedFlight.price,
            price: getTotalFlightPrice(selectedFlight),
            passengerSelection: passengerSelection
        };


        // Populate the modal with selected flight information
        if (selectedFlightBody) {

            selectedFlightBody.innerHTML = `
                <div>

                    <strong>
                        ${selectedFlight.airline}
                    </strong>

                    <div>
                        ${selectedFlight.flightNumber}
                    </div>

                    <hr>

                    <div>
                        ${selectedFlight.departureTime}
                        →
                        ${selectedFlight.arrivalTime}
                    </div>

                    <div>
                        ${escapeSearchText(selectedFlight.departureAirport)}${selectedFlight.departureAirportName ? " · " + escapeSearchText(selectedFlight.departureAirportName) : ""}
                        →
                        ${escapeSearchText(selectedFlight.arrivalAirport)}${selectedFlight.arrivalAirportName ? " · " + escapeSearchText(selectedFlight.arrivalAirportName) : ""}
                    </div>

                    <div>
                        ${selectedFlight.duration}
                    </div>

                    <hr>

                    <strong>
                          ${getTotalFlightPrice(selectedFlight).toLocaleString("tr-TR")} TL
                    </strong>

                </div>
            `;

        }


        console.log(
            "Selected flight:",
            selectedFlight
        );


        if (selectFlightModal) {

            const modal =
                bootstrap.Modal.getOrCreateInstance(
                    selectFlightModal
                );

            modal.show();

        }

    }
);


// =====================================================
// DEPARTURE TIME FILTERS
// =====================================================

if (filterMorning) {

    filterMorning.addEventListener(
        "change",
        renderFlights
    );

}

if (filterNoon) {

    filterNoon.addEventListener(
        "change",
        renderFlights
    );

}

if (filterEvening) {

    filterEvening.addEventListener(
        "change",
        renderFlights
    );

}

if (filterNight) {

    filterNight.addEventListener(
        "change",
        renderFlights
    );

}


// =====================================================
// DURATION FILTER
// =====================================================

if (
    durationRange &&
    durationRangeValue
) {

    durationRange.addEventListener(
        "input",
        function () {


            const totalMinutes =
                Number(durationRange.value);


            const hours =
                Math.floor(
                    totalMinutes / 60
                );


            const minutes =
                totalMinutes % 60;


            durationRangeValue.textContent =
                minutes === 0
                    ? `${hours} saat`
                    : `${hours} sa ${minutes} dk`;


            renderFlights();

        }
    );

}


// =====================================================
// BAGGAGE FILTERS
// =====================================================

if (filterCabinBaggage) {

    filterCabinBaggage.addEventListener(
        "change",
        renderFlights
    );

}

if (filterCheckedBaggage) {

    filterCheckedBaggage.addEventListener(
        "change",
        renderFlights
    );

}


// =====================================================
// MODAL CONTINUE BUTTON
// =====================================================

if (modalContinueBtn) {

    modalContinueBtn.addEventListener(
        "click",
        function () {


            if (!selectedFlightForBooking) {
                return;
            }


            // ONE WAY: save the departure flight and continue to passenger info.
            if (flightTripType !== "roundTrip") {

                sessionStorage.setItem(
                    "selectedDepartureFlight",
                    JSON.stringify(selectedFlightForBooking)
                );

                sessionStorage.setItem("tripType", flightTripType);

                window.location.href =
                    "/Flights/PassengerInfo" +
                    "?flightId=" + selectedFlightForBooking.id +
                    "&tripType=" + encodeURIComponent(flightTripType);

                return;
            }


            // ROUND TRIP - DEPARTURE step: save the departure flight,
            // then reload the same page for the RETURN step.
            if (flightStep !== "return") {

                sessionStorage.setItem(
                    "selectedDepartureFlight",
                    JSON.stringify(selectedFlightForBooking)
                );

                sessionStorage.setItem("tripType", "roundTrip");

                window.location.href =
                    "/Flights/SearchResults?tripType=roundTrip&step=return";

                return;
            }


            // ROUND TRIP - RETURN step: save the return flight,
            // then continue to passenger info.
            sessionStorage.setItem(
                "selectedReturnFlight",
                JSON.stringify(selectedFlightForBooking)
            );

            sessionStorage.setItem("tripType", "roundTrip");

            window.location.href =
                "/Flights/PassengerInfo" +
                "?flightId=" + selectedFlightForBooking.id +
                "&tripType=roundTrip";

        }
    );

}


// =====================================================
// INITIAL RENDER
// =====================================================

updateRouteHeader();
loadFlights();
