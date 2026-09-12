document.addEventListener("DOMContentLoaded", () => {
    const panel = document.querySelector(".search-panel");
    if (!panel || panel.dataset.heroInitialized) return;
    panel.dataset.heroInitialized = "true";

    const trips = panel.querySelector('[data-content="my-trips"]');
    const checkin = panel.querySelector('[data-content="checkin"]');
    const status = panel.querySelector('[data-content="flight-status"]');
    const mtButton = trips.querySelector("button");
    const ciButton = checkin.querySelector("button");
    const fsButton = status.querySelector("button");
    const mtResult = addResult(trips, "mtResult");
    const ciResult = addResult(checkin, "ciResult");
    const fsResult = addResult(status, "fsResult");
    let request = new AbortController();
    let checkinData = null;
    let credentials = null;
    let selectedSeat = "";
    let boardingPass = null;
    let previousFocus = null;

    const modal = document.createElement("dialog");
    modal.className = "hero-boarding-modal";
    modal.setAttribute("aria-labelledby", "boardingTitle");
    modal.innerHTML = '<div class="hero-result-heading"><h2 id="boardingTitle">Biniş kartı</h2><button type="button" class="hero-close" id="boardingClose" aria-label="Kapat">×</button></div><div id="boardingDetails"></div><button type="button" class="btn-primary-altura" id="boardingDownload">Boarding Pass’i İndir</button>';
    document.body.appendChild(modal);

    // Same airline logo files the SearchResults cards use.
    const airlineLogos = { TK: "/images/airlines/tk.png", PC: "/images/airlines/pc.png", VF: "/images/airlines/vf.png" };

    function addResult(pane, id) {
        const result = document.createElement("div");
        result.id = id;
        result.className = "hero-action-result";
        result.setAttribute("aria-live", "polite");
        result.hidden = true;
        pane.appendChild(result);
        return result;
    }

    function escape(value) {
        const element = document.createElement("span");
        element.textContent = value ?? "";
        return element.innerHTML;
    }

    function dateText(value) {
        return value ? new Date(value + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "";
    }

    // "2026-09-11" -> "11 Eyl 2026, Cuma" (same style as ReservationSuccess).
    function shortDateText(value) {
        if (!value) return "";
        const date = new Date(value + "T12:00:00");
        return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) + ", " + date.toLocaleDateString("tr-TR", { weekday: "long" });
    }

    // "2026-09-11" -> "11 Eyl 2026" (boarding pass: short so it fits the ticket cells).
    function ticketDateText(value) {
        return value ? new Date(value + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) : "";
    }

    function money(value) {
        return Number(value || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + " TL";
    }

    function stopsText(stops) {
        return Number(stops) > 0 ? stops + " Aktarma" : "Direkt";
    }

    // Airline code comes from the API; the flight status result only has the flight number ("TK2023 / TK2816" -> "TK").
    function airlineCodeOf(flight) {
        return String(flight.airlineCode || String(flight.flightNumber || "").substring(0, 2)).toUpperCase();
    }

    function logoHtml(flight) {
        const src = airlineLogos[airlineCodeOf(flight)];
        if (!src) return `<span class="hero-airline-logo hero-airline-logo--text">${escape(airlineCodeOf(flight))}</span>`;
        return `<span class="hero-airline-logo"><img src="${src}" alt="${escape(flight.airline)}"></span>`;
    }

    // One airport column: time, IATA code, real airport name (only when the backend has it) and date.
    function pointHtml(time, code, name, date, arrival) {
        return `<div class="hero-flight-point${arrival ? " hero-flight-point--arrival" : ""}">${time ? `<strong>${escape(time)}</strong>` : ""}<span class="iata">${escape(code)}</span>${name ? `<span class="airport">${escape(name)}</span>` : ""}${date ? `<span class="date">${escape(date)}</span>` : ""}</div>`;
    }

    // 1-stop itineraries: one row per leg (real segment data stored with the reservation). Older reservations have no segments.
    function segmentsHtml(segments) {
        if (!segments || segments.length < 2) return "";
        return `<div class="hero-segments">${segments.map((segment, index) => `<div class="hero-segment"><span class="hero-segment-no">${index + 1}. Uçuş</span><strong>${escape(segment.flightNumber)}</strong><span>${escape(segment.departureAirport)}${segment.departureAirportName ? " · " + escape(segment.departureAirportName) : ""} → ${escape(segment.arrivalAirport)}${segment.arrivalAirportName ? " · " + escape(segment.arrivalAirportName) : ""}</span><span class="hero-segment-time">${escape(segment.departureTime)} → ${escape(segment.arrivalTime)}</span></div>`).join("")}</div>`;
    }

    function tagsHtml(tags) {
        return tags.map(tag => `<span class="hero-tag"><i class="bi ${tag.icon}"></i> ${escape(tag.text)}</span>`).join("");
    }

    // Flight card in the SearchResults / ReservationSuccess language.
    function flightCardHtml(flight, date, label, tags) {
        const dateLabel = shortDateText(date);
        return `<article class="hero-flight-card">
            <div class="hero-flight-card-head"><span class="hero-flight-label"><i class="bi bi-airplane"></i> ${escape(label)}</span><span class="hero-chip"><i class="bi bi-clock"></i> ${escape(flight.duration || "")} · ${stopsText(flight.stops)}</span></div>
            <div class="hero-flight-airline">${logoHtml(flight)}<div><strong>${escape(flight.airline)}</strong><span>${escape(flight.flightNumber)}</span></div><div class="hero-flight-tags">${tagsHtml(tags || [])}</div></div>
            <div class="hero-flight-row">${pointHtml(flight.departureTime, flight.departureAirport, flight.departureAirportName, dateLabel)}<div class="hero-flight-path"><span>${stopsText(flight.stops)}</span><div class="hero-flight-line"><span class="dot"></span><span class="path"></span><i class="bi bi-airplane-fill"></i><span class="path"></span><span class="dot"></span></div></div>${pointHtml(flight.arrivalTime, flight.arrivalAirport, flight.arrivalAirportName, dateLabel, true)}</div>
            ${segmentsHtml(flight.segments)}
        </article>`;
    }

    function baggageTags(trip) {
        const cabinBag = trip.baggageSelection?.cabinBaggage || {};
        const checkedBag = trip.baggageSelection?.checkedBaggage || {};
        const tags = [{ icon: "bi-ticket-fill", text: trip.cabin }];
        if (cabinBag.name) tags.push({ icon: "bi-bag", text: cabinBag.name });
        tags.push(checkedBag.kg > 0 ? { icon: "bi-luggage-fill", text: checkedBag.kg + " kg" } : { icon: "bi-luggage", text: "Ek bagaj yok" });
        return tags;
    }

    function error(result, message) {
        result.hidden = false;
        result.innerHTML = `<p class="hero-error" role="alert">${escape(message)}</p>`;
    }

    async function fetchData(url, body, signal) {
        const options = { signal };
        if (body) {
            options.method = "POST";
            options.headers = { "Content-Type": "application/json" };
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || "İşlem tamamlanamadı. Bilgilerinizi kontrol edip tekrar deneyin.");
        if (!data) throw new Error("Yanıt okunamadı. Lütfen tekrar deneyin.");
        return data;
    }

    function readCredentials(prefix) {
        return { pnr: document.getElementById(prefix + "Pnr").value.trim().toUpperCase(), surname: document.getElementById(prefix + "Surname").value.trim() };
    }

    function resetInputs(pane) {
        pane.querySelectorAll("input").forEach(input => input.value = input.defaultValue);
    }

    // ===== MY TRIPS =====
    function tripHtml(trip) {
        const tripLabel = trip.tripType === "roundTrip" ? "Gidiş - Dönüş" : "Tek Yön";
        const tags = [{ icon: "bi-ticket-fill", text: trip.cabin }];
        const cabinBag = trip.baggageSelection?.cabinBaggage || {};
        const checkedBag = trip.baggageSelection?.checkedBaggage || {};
        const price = trip.priceSummary || {};
        const flightTotal = Number(price.departureFlightPrice || 0) + Number(price.returnFlightPrice || 0);
        const baggageTotal = Number(price.cabinBaggagePrice || 0) + Number(price.checkedBaggagePrice || 0);
        const dates = dateText(trip.departureDate) + (trip.returnDate ? " - " + dateText(trip.returnDate) : "");

        return `<div class="hero-trip">
            <div class="hero-trip-band"><div class="hero-pnr"><span>Rezervasyon Kodu (PNR)</span><strong>${escape(trip.pnr)}</strong></div><div class="hero-trip-route"><span>Rota</span><strong>${escape(trip.from)} → ${escape(trip.to)}</strong><small>${escape(dates)} · ${trip.totalPassengers} Yolcu · ${escape(trip.cabin)} · ${tripLabel}</small></div></div>
            ${flightCardHtml(trip.departureFlight, trip.departureDate, "Gidiş Uçuşu", tags)}
            ${trip.returnFlight ? flightCardHtml(trip.returnFlight, trip.returnDate, "Dönüş Uçuşu", tags) : ""}
            <div class="hero-trip-grid">
                <div class="hero-trip-box"><h5><i class="bi bi-people"></i> Yolcular</h5><ul class="hero-passengers">${trip.passengers.map(p => `<li><strong>${escape(p.firstName)} ${escape(p.lastName)}</strong><span>${escape(p.passengerType)}</span></li>`).join("")}</ul></div>
                <div class="hero-trip-box"><h5><i class="bi bi-luggage"></i> Bagaj</h5><p><span>Kabin bagajı</span><strong>${escape(cabinBag.name || "-")}</strong></p><p><span>Uçak altı bagajı</span><strong>${escape(checkedBag.name || "-")}</strong></p></div>
                <div class="hero-trip-box"><h5><i class="bi bi-receipt"></i> Ödeme Özeti</h5><p><span>Uçuş</span><strong>${money(flightTotal)}</strong></p><p><span>Bagaj</span><strong>${money(baggageTotal)}</strong></p><p class="hero-total-line"><span>Toplam</span><strong>${money(price.totalPrice)}</strong></p></div>
            </div>
        </div>`;
    }

    mtButton.addEventListener("click", async () => {
        if (mtButton.disabled) return;
        const body = readCredentials("mt");
        if (!body.pnr || !body.surname) return error(mtResult, "Lütfen PNR ve soyad girin.");
        mtResult.replaceChildren();
        mtResult.hidden = true;
        const original = mtButton.innerHTML;
        const signal = request.signal;
        mtButton.disabled = true;
        mtButton.textContent = "Kontrol ediliyor...";
        try {
            const trip = await fetchData("/api/Reservations/trip", body, signal);
            if (signal.aborted) return;
            mtResult.innerHTML = tripHtml(trip);
            mtResult.hidden = false;
            resetInputs(trips);
        } catch (ex) {
            if (!signal.aborted) error(mtResult, ex.message);
        } finally {
            mtButton.disabled = false;
            mtButton.innerHTML = original;
        }
    });

    // ===== CHECK-IN =====
    ciButton.addEventListener("click", async () => {
        if (ciButton.disabled) return;
        const body = readCredentials("ci");
        if (!body.pnr || !body.surname) return error(ciResult, "Lütfen PNR ve soyad girin.");
        checkinData = null;
        credentials = null;
        selectedSeat = "";
        ciResult.replaceChildren();
        ciResult.hidden = true;
        const original = ciButton.innerHTML;
        const signal = request.signal;
        ciButton.disabled = true;
        ciButton.textContent = "Kontrol ediliyor...";
        try {
            const data = await fetchData("/api/Reservations/check-in/lookup", body, signal);
            if (signal.aborted) return;
            checkinData = data;
            credentials = body;
            renderCheckin();
            resetInputs(checkin);
        } catch (ex) {
            if (!signal.aborted) {
                checkinData = null;
                credentials = null;
                error(ciResult, ex.message);
            }
        } finally {
            ciButton.disabled = false;
            ciButton.innerHTML = original;
        }
    });

    // Desktop: reservation + flight info on the left, seat map on the right. Mobile: stacked (CSS).
    function renderCheckin() {
        const trip = checkinData.trip;
        ciResult.hidden = false;
        ciResult.innerHTML = `<div class="hero-checkin-layout">
            <div class="hero-checkin-left">
                <div class="hero-checkin-fields field"><div><label for="ciPassenger">Yolcu</label><select id="ciPassenger" class="g-input">${trip.passengers.map(p => `<option value="${escape(p.passengerId)}">${escape(p.firstName)} ${escape(p.lastName)}</option>`).join("")}</select></div><div><label for="ciFlight">Uçuş</label><select id="ciFlight" class="g-input">${checkinData.flights.map(f => `<option value="${f.flightId}">${escape(f.flight.flightNumber)} · ${escape(f.flight.departureAirport)} → ${escape(f.flight.arrivalAirport)} · ${dateText(f.date)}</option>`).join("")}</select></div></div>
                <div class="hero-trip-band"><div class="hero-pnr"><span>PNR</span><strong>${escape(trip.pnr)}</strong></div><div class="hero-trip-route"><span>Yolcu</span><strong id="ciPassengerName"></strong><small>${escape(trip.cabin)} · ${trip.totalPassengers} Yolcu</small></div></div>
                <div id="ciFlightDetails"></div>
            </div>
            <div class="hero-checkin-right">
                <div class="hero-seat-head"><h4>Koltuk Seçimi</h4><p class="hero-note">Demo koltuk planı — gerçek havayolu koltuk envanteri değildir.</p></div>
                <div id="ciSeatArea"></div>
                <p id="ciActionError" class="hero-error" role="alert"></p>
            </div>
        </div>`;
        document.getElementById("ciPassenger").addEventListener("change", renderSeats);
        document.getElementById("ciFlight").addEventListener("change", renderSeats);
        renderSeats();
    }

    function renderSeats() {
        selectedSeat = "";
        document.getElementById("ciActionError").textContent = "";
        const passengerSelect = document.getElementById("ciPassenger");
        const passengerId = passengerSelect.value;
        const flightId = Number(document.getElementById("ciFlight").value);
        const selectedFlight = checkinData.flights.find(f => f.flightId === flightId);
        document.getElementById("ciPassengerName").textContent = passengerSelect.options[passengerSelect.selectedIndex].text;
        document.getElementById("ciFlightDetails").innerHTML = flightCardHtml(selectedFlight.flight, selectedFlight.date, "Uçuş", baggageTags(checkinData.trip));
        const area = document.getElementById("ciSeatArea");
        const existing = checkinData.checkIns.find(c => c.passengerId === passengerId && c.flightId === flightId);
        if (existing) {
            area.innerHTML = `<p>Bu yolcu için demo check-in daha önce tamamlanmış. Koltuk: <strong>${escape(existing.seatNumber)}</strong></p><button type="button" class="btn-primary-altura" id="ciShowPass">Biniş kartını görüntüle</button>`;
            document.getElementById("ciShowPass").addEventListener("click", () => showBoardingPass(existing));
            return;
        }
        let seats = "";
        for (let row = 1; row <= 30; row++) {
            seats += '<div class="hero-seat-row">';
            for (const letter of "ABCDEF") {
                if (letter === "D") seats += `<span class="hero-seat-aisle">${row}</span>`;
                const seat = row + letter;
                const occupied = selectedFlight.occupiedSeats.includes(seat);
                seats += `<button type="button" class="hero-seat" data-seat="${seat}" aria-label="${seat}${occupied ? ' dolu' : ' uygun'}" aria-pressed="false" ${occupied ? "disabled" : ""}>${seat}</button>`;
            }
            seats += "</div>";
        }
        area.innerHTML = `<div class="hero-seat-legend"><span>□ Uygun</span><span class="hero-seat-occupied">■ Dolu</span><span class="hero-seat-selected">■ Seçili</span></div><div class="hero-seat-map" tabindex="0" aria-label="Demo koltuk planı, 30 sıra">${seats}</div><p class="hero-seat-caption"><span>Seçilen Koltuk</span><strong id="ciSelectedSeat">Henüz seçilmedi</strong></p><button type="button" class="btn-primary-altura" id="ciComplete" disabled>Check-in’i Tamamla</button>`;
        area.querySelectorAll("[data-seat]").forEach(button => button.addEventListener("click", () => {
            area.querySelectorAll("[data-seat]").forEach(seat => {
                seat.classList.remove("is-selected");
                seat.setAttribute("aria-pressed", "false");
            });
            selectedSeat = button.dataset.seat;
            button.classList.add("is-selected");
            button.setAttribute("aria-pressed", "true");
            document.getElementById("ciSelectedSeat").textContent = selectedSeat;
            document.getElementById("ciComplete").disabled = false;
        }));
        document.getElementById("ciComplete").addEventListener("click", completeCheckin);
    }

    async function completeCheckin() {
        const button = document.getElementById("ciComplete");
        if (button.disabled || !selectedSeat) return;
        const signal = request.signal;
        const passenger = document.getElementById("ciPassenger");
        const flight = document.getElementById("ciFlight");
        button.disabled = true;
        passenger.disabled = true;
        flight.disabled = true;
        ciButton.disabled = true;
        ciResult.querySelectorAll("[data-seat]").forEach(seat => seat.disabled = true);
        button.textContent = "Kaydediliyor...";
        try {
            const pass = await fetchData("/api/Reservations/check-in", { ...credentials, passengerId: passenger.value, flightId: Number(flight.value), seatNumber: selectedSeat }, signal);
            if (signal.aborted) return;
            checkinData.checkIns.push(pass);
            renderSeats();
            showBoardingPass(pass);
        } catch (ex) {
            if (!signal.aborted) {
                const occupied = checkinData.flights.find(f => f.flightId === Number(flight.value)).occupiedSeats;
                ciResult.querySelectorAll("[data-seat]").forEach(seat => seat.disabled = occupied.includes(seat.dataset.seat));
                button.disabled = false;
                button.textContent = "Check-in’i Tamamla";
                document.getElementById("ciActionError").textContent = ex.message;
            }
        } finally {
            passenger.disabled = false;
            flight.disabled = false;
            ciButton.disabled = false;
        }
    }

    // ===== BOARDING PASS (modal) =====
    // Ticket layout: main part (route + passenger grid) and a stub on the right. Only real reservation data is shown.
    function ticketHtml(pass) {
        const date = ticketDateText(pass.date);
        return `<div class="hero-ticket">
            <div class="hero-ticket-main">
                <div class="hero-ticket-bar"><span>FlyToHappy · Boarding Pass</span><span class="hero-ticket-demo">Demo</span></div>
                <div class="hero-ticket-route">
                    <div class="hero-ticket-point"><small>From</small><strong>${escape(pass.from)}</strong>${pass.fromAirportName ? `<span>${escape(pass.fromAirportName)}</span>` : ""}<em>${escape(date)} · ${escape(pass.departureTime)}</em></div>
                    <div class="hero-ticket-plane"><span class="path"></span><i class="bi bi-airplane-fill"></i><span class="path"></span></div>
                    <div class="hero-ticket-point hero-ticket-point--to"><small>To</small><strong>${escape(pass.to)}</strong>${pass.toAirportName ? `<span>${escape(pass.toAirportName)}</span>` : ""}</div>
                </div>
                <dl class="hero-ticket-grid"><div><dt>Passenger</dt><dd>${escape(pass.passengerName)}</dd></div><div><dt>Flight</dt><dd>${escape(pass.flightNumber)}</dd></div><div><dt>Date</dt><dd>${escape(date)}</dd></div><div><dt>Seat</dt><dd class="hero-ticket-seat">${escape(pass.seatNumber)}</dd></div></dl>
                <dl class="hero-ticket-grid hero-ticket-grid--bottom"><div><dt>PNR</dt><dd>${escape(pass.pnr)}</dd></div><div><dt>Class</dt><dd>${escape(pass.cabin)}</dd></div><div><dt>Boarding Pass No</dt><dd>${escape(pass.boardingPassNumber)}</dd></div></dl>
                <p class="hero-ticket-note">DEMO BOARDING PASS — Havayolunda geçerli değildir.</p>
            </div>
            <div class="hero-ticket-stub">
                <div class="hero-ticket-bar"><span>${escape(pass.airline)}</span></div>
                <dl><div><dt>Passenger</dt><dd>${escape(pass.passengerName)}</dd></div><div><dt>Class</dt><dd>${escape(pass.cabin)}</dd></div><div><dt>Date</dt><dd>${escape(date)}</dd></div><div><dt>Departure</dt><dd>${escape(pass.departureTime)}</dd></div><div><dt>Seat</dt><dd class="hero-ticket-seat">${escape(pass.seatNumber)}</dd></div><div><dt>PNR</dt><dd>${escape(pass.pnr)}</dd></div></dl>
            </div>
        </div>`;
    }

    function showBoardingPass(pass) {
        boardingPass = pass;
        previousFocus = document.activeElement;
        document.getElementById("boardingDetails").innerHTML = ticketHtml(pass);
        modal.showModal();
        document.body.classList.add("hero-boarding-open");
    }

    modal.addEventListener("close", () => {
        document.body.classList.remove("hero-boarding-open");
        boardingPass = null;
        clearCheckin();
        if (previousFocus?.isConnected) previousFocus.focus();
        else ciButton.focus();
    });
    document.getElementById("boardingClose").addEventListener("click", () => modal.close());

    // ===== BOARDING PASS (PNG download) =====
    // Draws the same ticket as the modal on a canvas: orange header bar, FROM/TO blocks, info grid, dashed stub.
    function drawLabelValue(context, x, y, label, value, valueSize, valueColor) {
        context.fillStyle = "rgba(255,255,255,.62)";
        context.font = "600 15px sans-serif";
        context.fillText(label.toUpperCase(), x, y);
        context.fillStyle = valueColor || "#ffffff";
        context.font = "bold " + (valueSize || 26) + "px sans-serif";
        context.fillText(value || "-", x, y + (valueSize || 26) + 10);
    }

    function drawTicket(pass) {
        const canvas = document.createElement("canvas");
        canvas.width = 1400;
        canvas.height = 620;
        const context = canvas.getContext("2d");
        const date = ticketDateText(pass.date);
        const stubX = 1000;

        // Card background (warm brown) and orange header bars.
        context.fillStyle = "#35251f";
        context.fillRect(0, 0, canvas.width, canvas.height);
        const header = context.createLinearGradient(0, 0, canvas.width, 0);
        header.addColorStop(0, "#ff6a3d");
        header.addColorStop(1, "#ffb020");
        context.fillStyle = header;
        context.fillRect(0, 0, canvas.width, 84);
        context.fillStyle = "#ffffff";
        context.font = "bold 26px sans-serif";
        context.fillText("FLYTOHAPPY · BOARDING PASS", 48, 53);
        context.fillText(pass.airline.toUpperCase(), stubX + 40, 53);
        context.fillStyle = "rgba(74,29,15,.45)";
        context.fillRect(870, 26, 96, 34);
        context.fillStyle = "#ffffff";
        context.font = "bold 18px sans-serif";
        context.fillText("DEMO", 892, 50);

        // Dashed line between the main part and the stub.
        context.strokeStyle = "rgba(255,255,255,.4)";
        context.setLineDash([12, 10]);
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(stubX, 84);
        context.lineTo(stubX, canvas.height);
        context.stroke();
        context.setLineDash([]);

        // FROM / TO blocks with big IATA codes and the real airport names.
        context.textAlign = "left";
        drawLabelValue(context, 48, 140, "From", pass.from, 88);
        context.fillStyle = "#ffcf5c";
        context.font = "600 24px sans-serif";
        context.fillText(pass.fromAirportName || "", 48, 272);
        context.fillStyle = "rgba(255,255,255,.75)";
        context.font = "22px sans-serif";
        context.fillText(date + " · " + pass.departureTime, 48, 306);
        context.textAlign = "right";
        drawLabelValue(context, 950, 140, "To", pass.to, 88);
        context.fillStyle = "#ffcf5c";
        context.font = "600 24px sans-serif";
        context.fillText(pass.toAirportName || "", 950, 272);
        context.textAlign = "left";

        // Route line with a plane in the middle.
        context.strokeStyle = "rgba(255,176,32,.6)";
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(400, 210);
        context.lineTo(600, 210);
        context.stroke();
        context.fillStyle = "#ffcf5c";
        context.font = "34px sans-serif";
        context.textAlign = "center";
        context.fillText("✈", 500, 222);
        context.textAlign = "left";

        // Info grid (two rows), like the modal.
        context.strokeStyle = "rgba(255,255,255,.25)";
        context.setLineDash([8, 8]);
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(48, 340);
        context.lineTo(950, 340);
        context.stroke();
        context.setLineDash([]);
        drawLabelValue(context, 48, 385, "Passenger", pass.passengerName);
        drawLabelValue(context, 330, 385, "Flight", pass.flightNumber);
        drawLabelValue(context, 600, 385, "Date", date);
        drawLabelValue(context, 820, 385, "Seat", pass.seatNumber, 34, "#ffcf5c");
        drawLabelValue(context, 48, 480, "PNR", pass.pnr);
        drawLabelValue(context, 330, 480, "Class", pass.cabin);
        drawLabelValue(context, 600, 480, "Boarding Pass No", pass.boardingPassNumber, 18);
        context.fillStyle = "#ffd9c4";
        context.font = "18px sans-serif";
        context.fillText("DEMO BOARDING PASS — Havayolunda geçerli değildir.", 48, 580);

        // Stub: short summary of the same data.
        drawLabelValue(context, stubX + 40, 140, "Passenger", pass.passengerName, 22);
        drawLabelValue(context, stubX + 40, 225, "Class", pass.cabin, 22);
        drawLabelValue(context, stubX + 40, 310, "Date", date, 22);
        drawLabelValue(context, stubX + 250, 310, "Departure", pass.departureTime, 22);
        drawLabelValue(context, stubX + 40, 395, "Seat", pass.seatNumber, 34, "#ffcf5c");
        drawLabelValue(context, stubX + 250, 395, "PNR", pass.pnr, 22);
        drawLabelValue(context, stubX + 40, 490, "From → To", pass.from + " → " + pass.to, 22);
        return canvas;
    }

    document.getElementById("boardingDownload").addEventListener("click", () => {
        if (!boardingPass) return;
        const pass = boardingPass;
        const canvas = drawTicket(pass);
        const link = document.createElement("a");
        link.download = "FlyToHappy-Demo-" + pass.boardingPassNumber + ".png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        modal.close();
    });

    // ===== FLIGHT STATUS =====
    function statusHtml(data) {
        const date = shortDateText(data.date);
        return `<div class="hero-status">
            <div class="hero-status-head">${logoHtml(data)}<div><strong>${escape(data.airline)}</strong><span>${escape(data.flightNumber)}</span></div><span class="hero-chip hero-chip--muted"><i class="bi bi-info-circle"></i> ${escape(data.statusMessage)}</span></div>
            <div class="hero-flight-card">
                <div class="hero-flight-row">${pointHtml(data.departureTime, data.from, data.fromAirportName, "Planlanan kalkış · " + date)}<div class="hero-flight-path"><span>${data.segments && data.segments.length > 1 ? (data.segments.length - 1) + " Aktarma" : "Direkt"}</span><div class="hero-flight-line"><span class="dot"></span><span class="path"></span><i class="bi bi-airplane-fill"></i><span class="path"></span><span class="dot"></span></div></div>${pointHtml(data.arrivalTime, data.to, data.toAirportName, "Planlanan varış", true)}</div>
                ${segmentsHtml(data.segments)}
            </div>
            <p class="hero-note">Kayıtlı rezervasyon uçuş bilgileri.</p>
        </div>`;
    }

    fsButton.addEventListener("click", async () => {
        if (fsButton.disabled) return;
        const flightNumber = document.getElementById("fsNo").value.trim().replace(/\s/g, "").toUpperCase();
        const date = document.getElementById("fsDate").value;
        if (!flightNumber || !date) return error(fsResult, "Lütfen uçuş numarası ve tarih girin.");
        fsResult.replaceChildren();
        fsResult.hidden = true;
        const original = fsButton.innerHTML;
        const signal = request.signal;
        fsButton.disabled = true;
        fsButton.textContent = "Sorgulanıyor...";
        try {
            const data = await fetchData("/api/Reservations/flight-status?" + new URLSearchParams({ flightNumber, date }), null, signal);
            if (signal.aborted) return;
            fsResult.innerHTML = statusHtml(data);
            fsResult.hidden = false;
            resetInputs(status);
        } catch (ex) {
            if (!signal.aborted) error(fsResult, ex.message);
        } finally {
            fsButton.disabled = false;
            fsButton.innerHTML = original;
        }
    });

    function clearCheckin() {
        checkinData = null;
        credentials = null;
        selectedSeat = "";
        ciResult.replaceChildren();
        ciResult.hidden = true;
        resetInputs(checkin);
    }

    panel.querySelectorAll(".booking-main-tab").forEach(tab => tab.addEventListener("click", () => {
        request.abort();
        request = new AbortController();
        for (const result of [mtResult, fsResult]) {
            result.replaceChildren();
            result.hidden = true;
        }
        resetInputs(trips);
        resetInputs(status);
        clearCheckin();
    }));

    for (const pane of [trips, checkin, status]) {
        pane.addEventListener("keydown", event => {
            if (event.key === "Enter" && event.target.tagName === "INPUT") {
                event.preventDefault();
                pane.querySelector("button").click();
            }
        });
    }
});
