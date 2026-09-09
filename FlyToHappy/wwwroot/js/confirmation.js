const confirmationParams = new URLSearchParams(window.location.search);

const confirmationTripType =
    confirmationParams.get("tripType") ||
    sessionStorage.getItem("tripType") ||
    "oneWay";

const passengerInfo = getConfirmationStorage("passengerInfo");
const baggageSelection = getConfirmationStorage("baggageSelection");

function getConfirmationStorage(key) {
    try {
        const value = sessionStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function setConfirmationText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
        element.textContent = value || "-";
    }
}

function formatConfirmationPrice(value) {
    const price = Number(value) || 0;

    return `${price.toLocaleString("tr-TR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })} TL`;
}

// Format an ISO "YYYY-MM-DD" value as e.g. "20 Eyl 2030".
// Explicit Turkish month map avoids any browser locale-data fallback.
function formatConfirmationDate(value) {
    if (!value) {
        return "";
    }

    const parts = String(value).split("-");

    if (parts.length !== 3) {
        return value;
    }

    const day = Number(parts[2]);
    const monthIndex = Number(parts[1]) - 1;
    const year = parts[0];

    const months = [
        "Oca", "Şub", "Mar", "Nis", "May", "Haz",
        "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"
    ];

    if (monthIndex < 0 || monthIndex > 11) {
        return value;
    }

    return day + " " + months[monthIndex] + " " + year;
}

function renderPassengerInformation() {
    if (!passengerInfo) return;

    const passengersContainer =
        document.querySelector("#confirmPassengersContainer");

    if (!passengersContainer) return;

    // New multi-passenger structure
    // Fallback keeps old saved data working too
    const passengers =
        passengerInfo.passengers ||
        (passengerInfo.passenger
            ? [passengerInfo.passenger]
            : []);

    if (passengers.length === 0) {
        passengersContainer.innerHTML =
            "<p>Yolcu bilgisi bulunamadı.</p>";
        return;
    }

    passengersContainer.innerHTML =
        passengers.map((passenger, index) => {

            const fullName =
                `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim();

            const birthDate =
                passenger.birthDay &&
                    passenger.birthMonth &&
                    passenger.birthYear
                    ? `${passenger.birthDay}.${String(passenger.birthMonth).padStart(2, "0")}.${passenger.birthYear}`
                    : "-";

            const gender =
                passenger.gender === "Male"
                    ? "Erkek"
                    : passenger.gender === "Female"
                        ? "Kadın"
                        : "-";

            const nationalityNames = {
                TR: "Türkiye",
                DE: "Almanya",
                IT: "İtalya",
                FR: "Fransa"
            };

            const nationality =
                nationalityNames[passenger.nationality] ||
                passenger.nationality ||
                "-";

            const nationalId =
                passenger.notTurkishCitizen
                    ? "T.C. vatandaşı değil"
                    : passenger.nationalId || "-";

            const passport =
                passenger.hasPassport
                    ? passenger.passportNumber || "-"
                    : "Belirtilmedi";

            const passportExpiryText =
                passenger.hasPassport && passenger.passportExpiryDate
                    ? formatConfirmationDate(passenger.passportExpiryDate)
                    : "";

            // Only render an expiry row when the passenger actually has a passport date.
            const passportExpiryItem =
                passportExpiryText
                    ? `
                        <div class="confirmation-info-item">
                            <span>Pasaport Son Geçerlilik</span>
                            <strong>${passportExpiryText}</strong>
                        </div>`
                    : "";

            const passengerType =
                passenger.passengerType || "Yetişkin";

            return `
                <div class="confirmation-passenger-block">

                    <div class="confirmation-passenger-title">
                        <strong>${index + 1}. Yolcu</strong>
                        <span>${passengerType}</span>
                    </div>

                    <div class="confirmation-info-grid">

                        <div class="confirmation-info-item">
                            <span>Ad Soyad</span>
                            <strong>${fullName || "-"}</strong>
                        </div>

                        <div class="confirmation-info-item">
                            <span>Doğum Tarihi</span>
                            <strong>${birthDate}</strong>
                        </div>

                        <div class="confirmation-info-item">
                            <span>Cinsiyet</span>
                            <strong>${gender}</strong>
                        </div>

                        <div class="confirmation-info-item">
                            <span>Uyruk</span>
                            <strong>${nationality}</strong>
                        </div>

                        <div class="confirmation-info-item">
                            <span>T.C. Kimlik Numarası</span>
                            <strong>${nationalId}</strong>
                        </div>

                        <div class="confirmation-info-item">
                            <span>Pasaport</span>
                            <strong>${passport}</strong>
                        </div>
                        ${passportExpiryItem}

                    </div>

                </div>
            `;
        })
            .join("");

    setConfirmationText(
        "#confirmEmail",
        passengerInfo.contactEmail
    );

    setConfirmationText(
        "#confirmPhone",
        passengerInfo.contactPhone
    );

    setConfirmationText(
        "#confirmContactFirstName",
        passengerInfo.contactFirstName
    );

    setConfirmationText(
        "#confirmContactLastName",
        passengerInfo.contactLastName
    );
}

function getBaggageDescription(baggage, defaultText) {
    if (!baggage) return defaultText;

    const name =
        baggage.title ||
        baggage.name ||
        baggage.label ||
        defaultText;

    const kg = Number(baggage.kg) || 0;

    if (kg > 0 && !name.includes(`${kg}`)) {
        return `${name} - ${kg} kg`;
    }

    return name;
}

function renderBaggageInformation() {
    if (!baggageSelection) return;

    const cabin = baggageSelection.cabinBaggage;
    const checked = baggageSelection.checkedBaggage;

    setConfirmationText(
        "#confirmCabinBaggage",
        getBaggageDescription(cabin, "Kabin bagajı")
    );

    setConfirmationText(
        "#confirmCheckedBaggage",
        getBaggageDescription(checked, "Ek bagaj yok")
    );

    setConfirmationText(
        "#confirmCabinBaggagePrice",
        formatConfirmationPrice(cabin?.price)
    );

    setConfirmationText(
        "#confirmCheckedBaggagePrice",
        formatConfirmationPrice(checked?.price)
    );
}

const editPassengerBtn =
    document.querySelector("#editPassengerBtn");

const editBaggageBtn =
    document.querySelector("#editBaggageBtn");

const confirmationBackBtn =
    document.querySelector("#confirmationBackBtn");

const completeBookingBtn =
    document.querySelector("#completeBookingBtn");

const confirmationAgreement =
    document.querySelector("#confirmationAgreement");

editPassengerBtn?.addEventListener("click", () => {
    window.location.href =
        `/Flights/PassengerInfo?tripType=${encodeURIComponent(confirmationTripType)}`;
});

editBaggageBtn?.addEventListener("click", () => {
    window.location.href =
        `/Flights/Baggage?tripType=${encodeURIComponent(confirmationTripType)}`;
});

confirmationBackBtn?.addEventListener("click", () => {
    window.location.href =
        `/Flights/Baggage?tripType=${encodeURIComponent(confirmationTripType)}`;
});

completeBookingBtn?.addEventListener("click", () => {
    if (!confirmationAgreement?.checked) {
        alert("Ödemeye geçmeden önce rezervasyon bilgilerinizi onaylamalısınız.");
        return;
    }

    sessionStorage.setItem("tripType", confirmationTripType);

    window.location.href =
        `/Flights/Payment?tripType=${encodeURIComponent(confirmationTripType)}`;
});

renderPassengerInformation();
renderBaggageInformation();