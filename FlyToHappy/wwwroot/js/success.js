// =====================================================
// RESERVATION SUCCESS
// Self-contained: loads the saved reservation from the API
// and renders it. No dependency on other page scripts.
// Card data is never read from or written to storage here.
// =====================================================

(async function () {

    // =================================================
    // STORAGE HELPERS
    // =================================================

    function getSuccessStorage(key) {
        try {
            const value = sessionStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch {
            return null;
        }
    }

    // =================================================
    // DIRECT-ACCESS GUARD
    // =================================================

    // Storage provides only the reservation ID used to load the saved details.
    const reservationResult =
        getSuccessStorage("reservationResult");

    if (!reservationResult || !reservationResult.reservationId) {
        window.location.href = "/";
        return;
    }

    let reservation;

    try {
        const response = await fetch(
            `/api/Reservations/${encodeURIComponent(reservationResult.reservationId)}`
        );

        if (!response.ok) {
            window.location.href = "/";
            return;
        }

        reservation = await response.json();

        if (!reservation || !reservation.reservationId || !reservation.pnr) {
            window.location.href = "/";
            return;
        }
    } catch {
        window.location.href = "/";
        return;
    }

    const successTripType = reservation.tripType;
    const departureFlight = reservation.departureFlight;
    const returnFlight = reservation.returnFlight;
    const baggageSelection = reservation.baggageSelection;
    const priceSummary = reservation.priceSummary;


    // =================================================
    // GENERAL HELPERS
    // =================================================

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

    const airportCities = {
        IST: "İstanbul", SAW: "İstanbul", FCO: "Roma", CIA: "Roma",
        CDG: "Paris", LHR: "Londra", AMS: "Amsterdam", FRA: "Frankfurt",
        MUC: "Münih", BCN: "Barselona", MAD: "Madrid", VIE: "Viyana",
        ATH: "Atina", DXB: "Dubai", JFK: "New York", ESB: "Ankara",
        ADB: "İzmir", AYT: "Antalya"
    };

    const airlineMarks = {
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

    const turkishMonthsShort = [
        "Oca", "Şub", "Mar", "Nis", "May", "Haz",
        "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"
    ];

    const turkishWeekdays = [
        "Pazar", "Pazartesi", "Salı", "Çarşamba",
        "Perşembe", "Cuma", "Cumartesi"
    ];

    function getAirportName(code) {
        return airports[code] || code || "";
    }

    function getAirportCity(code) {
        return airportCities[code] || code || "";
    }

    function getAirlineCode(flight) {
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

    function formatSuccessPrice(value) {
        const price = Number(value) || 0;

        return new Intl.NumberFormat("tr-TR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(price) + " TL";
    }

    // "YYYY-MM-DD" -> "4 Eyl 2026, Cuma" (locale-independent).
    function formatSuccessDate(value) {
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

        const day = Number(parts[2]);
        const monthShort = turkishMonthsShort[date.getMonth()];
        const weekday = turkishWeekdays[date.getDay()];

        return day + " " + monthShort + " " + parts[0] + ", " + weekday;
    }

    function setText(selector, value) {
        const element = document.querySelector(selector);

        if (element) {
            element.textContent = value;
        }
    }

    function escapeSuccessHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function setSuccessAirlineMark(selector, flight) {
        const element = document.querySelector(selector);

        if (!element) {
            return;
        }

        const airlineCode = String(getAirlineCode(flight)).toUpperCase();
        const airlineMark = airlineMarks[airlineCode];

        if (!airlineMark) {
            element.textContent = airlineCode;
            return;
        }

        const image = document.createElement("img");
        image.src = airlineMark.src;
        image.alt = (flight.airline || airlineMark.name) + " logosu";
        element.replaceChildren(image);
    }


    // =================================================
    // PNR
    // =================================================

    // The saved backend reservation is the authoritative PNR source.
    setText("#successPnr", reservation.pnr);


    // =================================================
    // FLIGHTS
    // =================================================

    function buildFlightCard(flight, dateIso, label, airlineMarkId) {
        const airlineCode = getAirlineCode(flight);
        const departureCode = flight.departureAirport || flight.from || "";
        const arrivalCode = flight.arrivalAirport || flight.to || "";
        const dateText = formatSuccessDate(dateIso);
        const stopText = Number(flight.stops) > 0
            ? Number(flight.stops) + " Aktarma"
            : "Direkt";

        const cabin = reservation.cabin || "Ekonomi";

        const checkedBaggageKg =
            Number(baggageSelection?.checkedBaggage?.kg) || 0;

        const baggageFact = checkedBaggageKg > 0
            ? `<span class="flight-summary-fact"><i class="bi bi-luggage-fill"></i>${checkedBaggageKg} kg</span>`
            : "";

        return `
            <div class="flight-summary-card">

                <div class="flight-summary-header">
                    <div class="flight-summary-title">
                        <i class="bi bi-airplane"></i>
                        <strong>${escapeSuccessHtml(label)}</strong>
                    </div>

                    <span class="flight-summary-chip">
                        <i class="bi bi-clock"></i>
                        ${escapeSuccessHtml(flight.duration || "-")}
                    </span>
                </div>

                <div class="flight-summary-airline">
                    <span class="flight-summary-airline-logo" id="${airlineMarkId}">${escapeSuccessHtml(airlineCode)}</span>

                    <div>
                        <strong>${escapeSuccessHtml(flight.airline || "Havayolu")}</strong>
                        <span>${escapeSuccessHtml(flight.flightNumber || "")}</span>
                    </div>

                    <div class="flight-summary-facts">
                        <span class="flight-summary-fact">
                            <i class="bi bi-ticket-fill"></i>
                            ${escapeSuccessHtml(cabin)}
                        </span>
                        ${baggageFact}
                    </div>
                </div>

                <div class="success-flight-row">
                    <div class="success-flight-point">
                        <strong>${escapeSuccessHtml(flight.departureTime || "--:--")}</strong>
                        <div class="iata">${escapeSuccessHtml(departureCode)}</div>
                        <div class="airport">${escapeSuccessHtml(getAirportName(departureCode))}</div>
                        <div class="date">${escapeSuccessHtml(dateText)}</div>
                    </div>

                    <div class="success-flight-path">
                        <span>${escapeSuccessHtml(stopText)}</span>
                        <div class="success-flight-line">
                            <span class="dot"></span>
                            <span class="path"></span>
                            <i class="bi bi-airplane-fill"></i>
                            <span class="path"></span>
                            <span class="dot"></span>
                        </div>
                    </div>

                    <div class="success-flight-point success-flight-point--arrival">
                        <strong>${escapeSuccessHtml(flight.arrivalTime || "--:--")}</strong>
                        <div class="iata">${escapeSuccessHtml(arrivalCode)}</div>
                        <div class="airport">${escapeSuccessHtml(getAirportName(arrivalCode))}</div>
                        <div class="date">${escapeSuccessHtml(dateText)}</div>
                    </div>
                </div>

            </div>
        `;
    }

    function renderFlights() {
        const container =
            document.querySelector("#successFlights");

        if (!container || !departureFlight) {
            return;
        }

        let html =
            buildFlightCard(
                departureFlight,
                reservation.departureDate,
                "Gidiş Uçuşu",
                "successDepartureAirlineMark"
            );

        if (
            successTripType === "roundTrip" &&
            returnFlight
        ) {
            html += buildFlightCard(
                returnFlight,
                reservation.returnDate,
                "Dönüş Uçuşu",
                "successReturnAirlineMark"
            );
        }

        container.innerHTML = html;
        setSuccessAirlineMark("#successDepartureAirlineMark", departureFlight);

        if (successTripType === "roundTrip" && returnFlight) {
            setSuccessAirlineMark("#successReturnAirlineMark", returnFlight);
        }
    }

    function renderTripSummary() {
        if (!departureFlight) {
            return;
        }

        const departureCode =
            departureFlight.departureAirport ||
            departureFlight.from ||
            reservation.from ||
            "";

        const arrivalCode =
            departureFlight.arrivalAirport ||
            departureFlight.to ||
            reservation.to ||
            "";

        const routeText =
            getAirportCity(departureCode) + " (" + departureCode + ") → " +
            getAirportCity(arrivalCode) + " (" + arrivalCode + ")";

        const passengerCount = reservation.totalPassengers;
        const cabin = reservation.cabin || "Ekonomi";

        const metaParts = [
            formatSuccessDate(reservation.departureDate),
            passengerCount > 0 ? passengerCount + " Yolcu" : "",
            cabin
        ].filter(Boolean);

        setText("#successRoute", routeText);
        setText("#successTripMeta", metaParts.join(" · "));
    }


    // =================================================
    // PASSENGERS
    // =================================================

    function renderPassengers() {
        const container =
            document.querySelector("#successPassengers");

        if (!container) {
            return;
        }

        const passengers =
            reservation.passengers || [];

        if (passengers.length === 0) {
            container.innerHTML =
                "<p>Yolcu bilgisi bulunamadı.</p>";
            return;
        }

        const genderNames = {
            Male: "Erkek",
            Female: "Kadın"
        };

        const nationalityNames = {
            TR: "Türkiye",
            DE: "Almanya",
            IT: "İtalya",
            FR: "Fransa"
        };

        container.innerHTML =
            passengers.map((passenger, index) => {

                const fullName =
                    `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim();

                const birthParts = String(passenger.birthDate || "").split("-");
                const birthDate = birthParts.length === 3
                    ? `${Number(birthParts[2])}.${birthParts[1]}.${birthParts[0]}`
                    : "-";

                const gender =
                    genderNames[passenger.gender] || "-";

                const nationality =
                    nationalityNames[passenger.nationality] ||
                    passenger.nationality ||
                    "-";

                const nationalId =
                    passenger.notTurkishCitizen
                        ? "T.C. vatandaşı değil"
                        : passenger.nationalId || "-";

                const passengerType =
                    passenger.passengerType || "Yetişkin";

                // Passport rows only when the passenger has a passport.
                let passportItems = "";

                if (passenger.hasPassport) {
                    passportItems += `
                        <div class="confirmation-info-item">
                            <span>Pasaport No</span>
                            <strong>${escapeSuccessHtml(passenger.passportNumber || "-")}</strong>
                        </div>`;

                    if (passenger.passportExpiryDate) {
                        passportItems += `
                        <div class="confirmation-info-item">
                            <span>Pasaport Son Geçerlilik</span>
                            <strong>${escapeSuccessHtml(formatSuccessDate(passenger.passportExpiryDate))}</strong>
                        </div>`;
                    }
                }

                return `
                    <div class="confirmation-passenger-block">

                        <div class="confirmation-passenger-title">
                            <strong>${index + 1}. Yolcu</strong>
                            <span>${escapeSuccessHtml(passengerType)}</span>
                        </div>

                        <div class="confirmation-info-grid">

                            <div class="confirmation-info-item">
                                <span>Ad Soyad</span>
                                <strong>${escapeSuccessHtml(fullName || "-")}</strong>
                            </div>

                            <div class="confirmation-info-item">
                                <span>Doğum Tarihi</span>
                                <strong>${escapeSuccessHtml(birthDate)}</strong>
                            </div>

                            <div class="confirmation-info-item">
                                <span>Cinsiyet</span>
                                <strong>${escapeSuccessHtml(gender)}</strong>
                            </div>

                            <div class="confirmation-info-item">
                                <span>Uyruk</span>
                                <strong>${escapeSuccessHtml(nationality)}</strong>
                            </div>

                            <div class="confirmation-info-item">
                                <span>T.C. Kimlik Numarası</span>
                                <strong>${escapeSuccessHtml(nationalId)}</strong>
                            </div>
                            ${passportItems}

                        </div>

                    </div>
                `;
            }).join("");
    }


    // =================================================
    // BAGGAGE
    // =================================================

    function describeBaggage(baggage, fallback) {
        if (!baggage) {
            return fallback;
        }

        const name = baggage.name || fallback;
        const kg = Number(baggage.kg) || 0;

        if (kg > 0 && !String(name).includes(`${kg}`)) {
            return `${name} - ${kg} kg`;
        }

        return name;
    }

    function renderBaggage() {
        if (!baggageSelection) {
            return;
        }

        const cabin = baggageSelection.cabinBaggage;
        const checked = baggageSelection.checkedBaggage;

        setText(
            "#successCabinName",
            describeBaggage(cabin, "Kabin bagajı")
        );

        setText(
            "#successCheckedName",
            describeBaggage(checked, "Ek bagaj yok")
        );

        setText(
            "#successCabinPrice",
            formatSuccessPrice(cabin && cabin.price)
        );

        setText(
            "#successCheckedPrice",
            formatSuccessPrice(checked && checked.price)
        );
    }


    // =================================================
    // PRICE SUMMARY (from the saved backend summary; not recalculated)
    // =================================================

    function renderPrice() {
        const summary = priceSummary || {};

        const departurePrice =
            Number(summary.departureFlightPrice) || 0;

        const returnPrice =
            Number(summary.returnFlightPrice) || 0;

        const cabinPrice =
            Number(summary.cabinBaggagePrice) || 0;

        const checkedPrice =
            Number(summary.checkedBaggagePrice) || 0;

        const totalPrice = Number(summary.totalPrice) || 0;

        setText("#successDeparturePrice", formatSuccessPrice(departurePrice));
        setText("#successSummaryCabinPrice", formatSuccessPrice(cabinPrice));
        setText("#successSummaryCheckedPrice", formatSuccessPrice(checkedPrice));
        setText("#successTotalPrice", formatSuccessPrice(totalPrice));

        const returnRow =
            document.querySelector("#successReturnRow");

        if (
            successTripType === "roundTrip" &&
            returnPrice > 0
        ) {
            returnRow?.classList.remove("d-none");
            setText("#successReturnPrice", formatSuccessPrice(returnPrice));
        } else {
            returnRow?.classList.add("d-none");
        }
    }


    // =================================================
    // HOME BUTTON: clear only this booking's keys
    // =================================================

    const homeButton =
        document.querySelector("#successHomeBtn");

    homeButton?.addEventListener("click", () => {
        const bookingKeys = [
            "searchData",
            "passengerSelection",
            "passengerInfo",
            "selectedDepartureFlight",
            "selectedReturnFlight",
            "baggageSelection",
            "bookingPriceSummary",
            "tripType",
            "reservationResult"
        ];

        bookingKeys.forEach(key => {
            sessionStorage.removeItem(key);
        });

        // The link then navigates to the home page.
    });


    // =================================================
    // INITIALIZE
    // =================================================

    renderFlights();
    renderTripSummary();
    renderPassengers();
    renderBaggage();
    renderPrice();

})();
