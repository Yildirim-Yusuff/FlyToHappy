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
    modal.innerHTML = '<div class="hero-result-heading"><h2 id="boardingTitle">Biniş kartı</h2><button type="button" class="hero-close" id="boardingClose" aria-label="Kapat">×</button></div><p class="hero-note">DEMO BOARDING PASS — Havayolunda geçerli değildir.</p><div id="boardingDetails"></div><button type="button" class="btn-primary-altura" id="boardingDownload">Boarding Pass’i İndir</button>';
    document.body.appendChild(modal);

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

    function flightHtml(flight, date) {
        return `<div class="hero-flight"><div class="hero-route"><strong>${escape(flight.departureAirport)}</strong><span aria-hidden="true">→</span><strong>${escape(flight.arrivalAirport)}</strong></div><p>${escape(flight.flightNumber)} · ${escape(flight.airline)}</p><p>${dateText(date)} · ${escape(flight.departureTime)} → ${escape(flight.arrivalTime)}</p></div>`;
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

    mtButton.addEventListener("click", async () => {
        if (mtButton.disabled) return;
        const body = readCredentials("mt");
        if (!body.pnr || !body.surname) return error(mtResult, "Lütfen PNR ve soyad girin.");
        const original = mtButton.innerHTML;
        const signal = request.signal;
        mtButton.disabled = true;
        mtButton.textContent = "Kontrol ediliyor...";
        try {
            const trip = await fetchData("/api/Reservations/trip", body, signal);
            if (signal.aborted) return;
            mtResult.innerHTML = `<div class="hero-result-heading"><h4>Seyahat detayları</h4><span>PNR: <strong>${escape(trip.pnr)}</strong></span></div>${flightHtml(trip.departureFlight, trip.departureDate)}${trip.returnFlight ? flightHtml(trip.returnFlight, trip.returnDate) : ""}<p>${escape(trip.cabin)} · ${trip.totalPassengers} yolcu</p><h4>Yolcular</h4><ul class="hero-passengers">${trip.passengers.map(p => `<li>${escape(p.firstName)} ${escape(p.lastName)} · ${escape(p.passengerType)}</li>`).join("")}</ul><h4>Bagaj</h4><p>${escape(trip.baggageSelection.cabinBaggage.name)} · ${escape(trip.baggageSelection.checkedBaggage.name)}</p><div class="hero-result-heading hero-total"><span>Toplam</span><strong>${Number(trip.priceSummary.totalPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</strong></div>`;
            mtResult.hidden = false;
            resetInputs(trips);
        } catch (ex) {
            if (!signal.aborted) error(mtResult, ex.message);
        } finally {
            mtButton.disabled = false;
            mtButton.innerHTML = original;
        }
    });

    ciButton.addEventListener("click", async () => {
        if (ciButton.disabled) return;
        const body = readCredentials("ci");
        if (!body.pnr || !body.surname) return error(ciResult, "Lütfen PNR ve soyad girin.");
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

    function renderCheckin() {
        ciResult.hidden = false;
        ciResult.innerHTML = `<div class="hero-checkin-fields field"><div><label for="ciPassenger">Yolcu</label><select id="ciPassenger" class="g-input">${checkinData.trip.passengers.map(p => `<option value="${escape(p.passengerId)}">${escape(p.firstName)} ${escape(p.lastName)}</option>`).join("")}</select></div><div><label for="ciFlight">Uçuş</label><select id="ciFlight" class="g-input">${checkinData.flights.map(f => `<option value="${f.flightId}">${escape(f.flight.flightNumber)} · ${escape(f.flight.departureAirport)} → ${escape(f.flight.arrivalAirport)} · ${dateText(f.date)}</option>`).join("")}</select></div></div><div id="ciFlightDetails"></div><p class="hero-note">Demo koltuk planı — gerçek havayolu koltuk envanteri değildir.</p><div id="ciSeatArea"></div><p id="ciActionError" class="hero-error" role="alert"></p>`;
        document.getElementById("ciPassenger").addEventListener("change", renderSeats);
        document.getElementById("ciFlight").addEventListener("change", renderSeats);
        renderSeats();
    }

    function renderSeats() {
        selectedSeat = "";
        document.getElementById("ciActionError").textContent = "";
        const passengerId = document.getElementById("ciPassenger").value;
        const flightId = Number(document.getElementById("ciFlight").value);
        const selectedFlight = checkinData.flights.find(f => f.flightId === flightId);
        document.getElementById("ciFlightDetails").innerHTML = flightHtml(selectedFlight.flight, selectedFlight.date) + `<p>${escape(checkinData.trip.cabin)}</p>`;
        const area = document.getElementById("ciSeatArea");
        const existing = checkinData.checkIns.find(c => c.passengerId === passengerId && c.flightId === flightId);
        if (existing) {
            area.innerHTML = '<p>Bu yolcu için demo check-in daha önce tamamlanmış.</p><button type="button" class="btn-primary-altura" id="ciShowPass">Biniş kartını görüntüle</button>';
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
        area.innerHTML = `<div class="hero-seat-legend"><span>□ Uygun</span><span class="hero-seat-occupied">■ Dolu</span><span class="hero-seat-selected">■ Seçili</span></div><div class="hero-seat-map" tabindex="0" aria-label="Demo koltuk planı, 30 sıra">${seats}</div><p id="ciSelectedSeat" class="hero-seat-caption">Lütfen bir koltuk seçin.</p><button type="button" class="btn-primary-altura" id="ciComplete" disabled>Check-in’i Tamamla</button>`;
        area.querySelectorAll("[data-seat]").forEach(button => button.addEventListener("click", () => {
            area.querySelectorAll("[data-seat]").forEach(seat => {
                seat.classList.remove("is-selected");
                seat.setAttribute("aria-pressed", "false");
            });
            selectedSeat = button.dataset.seat;
            button.classList.add("is-selected");
            button.setAttribute("aria-pressed", "true");
            document.getElementById("ciSelectedSeat").textContent = "Seçilen Koltuk: " + selectedSeat;
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

    function showBoardingPass(pass) {
        boardingPass = pass;
        previousFocus = document.activeElement;
        document.getElementById("boardingDetails").innerHTML = `<h3>${escape(pass.passengerName)}</h3><div class="hero-route"><strong>${escape(pass.from)}</strong><span>→</span><strong>${escape(pass.to)}</strong></div><p>${escape(pass.airline)} · ${escape(pass.flightNumber)}</p><p>${dateText(pass.date)} · ${escape(pass.departureTime)}</p><dl class="hero-pass-details"><div><dt>PNR</dt><dd>${escape(pass.pnr)}</dd></div><div><dt>Koltuk</dt><dd>${escape(pass.seatNumber)}</dd></div><div><dt>Kabin</dt><dd>${escape(pass.cabin)}</dd></div><div><dt>Biniş kartı numarası</dt><dd>${escape(pass.boardingPassNumber)}</dd></div></dl>`;
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
    document.getElementById("boardingDownload").addEventListener("click", () => {
        if (!boardingPass) return;
        const pass = boardingPass;
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 850;
        const context = canvas.getContext("2d");
        context.fillStyle = "#35251f";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#ffb020";
        context.font = "bold 36px sans-serif";
        context.fillText("FlyToHappy · DEMO BOARDING PASS", 60, 75);
        context.fillStyle = "#ffffff";
        context.font = "28px sans-serif";
        const lines = [pass.passengerName, `${pass.from} → ${pass.to}`, `${pass.airline} · ${pass.flightNumber}`, `${dateText(pass.date)} · ${pass.departureTime}`, `PNR: ${pass.pnr}`, `Koltuk: ${pass.seatNumber} · Kabin: ${pass.cabin}`, `Biniş kartı: ${pass.boardingPassNumber}`, "Demo check-in — havayolunda geçerli değildir."];
        lines.forEach((line, index) => context.fillText(line, 60, 155 + index * 77, 1080));
        const link = document.createElement("a");
        link.download = "FlyToHappy-Demo-" + pass.boardingPassNumber + ".png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        modal.close();
    });

    fsButton.addEventListener("click", async () => {
        if (fsButton.disabled) return;
        const flightNumber = document.getElementById("fsNo").value.trim().replace(/\s/g, "").toUpperCase();
        const date = document.getElementById("fsDate").value;
        if (!flightNumber || !date) return error(fsResult, "Lütfen uçuş numarası ve tarih girin.");
        const original = fsButton.innerHTML;
        const signal = request.signal;
        fsButton.disabled = true;
        fsButton.textContent = "Sorgulanıyor...";
        try {
            const data = await fetchData("/api/Reservations/flight-status?" + new URLSearchParams({ flightNumber, date }), null, signal);
            if (signal.aborted) return;
            fsResult.innerHTML = `<div class="hero-result-heading"><h4>${escape(data.flightNumber)} · ${escape(data.airline)}</h4></div><p class="hero-note">${escape(data.statusMessage)}</p><div class="hero-route"><strong>${escape(data.from)}</strong><span aria-hidden="true">→</span><strong>${escape(data.to)}</strong></div><div class="hero-status-times"><div><strong>${escape(data.departureTime)}</strong><span>Planlanan kalkış</span></div><div><strong>${escape(data.arrivalTime)}</strong><span>Planlanan varış</span></div></div><p>${dateText(data.date)}</p><p class="hero-note">Kayıtlı rezervasyon uçuş bilgileri.</p>`;
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
