const paymentParams =
    new URLSearchParams(window.location.search);

const paymentTripType =
    paymentParams.get("tripType") ||
    sessionStorage.getItem("tripType") ||
    "oneWay";


// =====================================================
// STORAGE
// =====================================================

function getPaymentStorage(key) {
    try {
        const value =
            sessionStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : null;
    } catch {
        return null;
    }
}


// =====================================================
// PRICE FORMAT
// =====================================================

function formatPaymentPrice(value) {
    const price =
        Number(value) || 0;

    return `${price.toLocaleString("tr-TR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })} TL`;
}


// =====================================================
// PAYMENT SUMMARY
// =====================================================

function renderPaymentSummary() {
    const priceSummary =
        getPaymentStorage("bookingPriceSummary");

    if (!priceSummary) {
        return;
    }

    const departurePrice =
        Number(
            priceSummary.departureFlightPrice
        ) || 0;

    const returnPrice =
        Number(
            priceSummary.returnFlightPrice
        ) || 0;

    const cabinPrice =
        Number(
            priceSummary.cabinBaggagePrice
        ) || 0;

    const checkedPrice =
        Number(
            priceSummary.checkedBaggagePrice
        ) || 0;

    const totalPrice =
        departurePrice +
        returnPrice +
        cabinPrice +
        checkedPrice;

    const departurePriceElement =
        document.querySelector(
            "#paymentDeparturePrice"
        );

    const returnPriceElement =
        document.querySelector(
            "#paymentReturnPrice"
        );

    const cabinPriceElement =
        document.querySelector(
            "#paymentCabinPrice"
        );

    const checkedPriceElement =
        document.querySelector(
            "#paymentCheckedPrice"
        );

    const totalPriceElement =
        document.querySelector(
            "#paymentTotalPrice"
        );

    const returnRow =
        document.querySelector(
            "#paymentReturnRow"
        );

    if (departurePriceElement) {
        departurePriceElement.textContent =
            formatPaymentPrice(
                departurePrice
            );
    }

    if (cabinPriceElement) {
        cabinPriceElement.textContent =
            formatPaymentPrice(
                cabinPrice
            );
    }

    if (checkedPriceElement) {
        checkedPriceElement.textContent =
            formatPaymentPrice(
                checkedPrice
            );
    }

    if (totalPriceElement) {
        totalPriceElement.textContent =
            formatPaymentPrice(
                totalPrice
            );
    }

    if (
        paymentTripType === "roundTrip" &&
        returnPrice > 0
    ) {
        returnRow?.classList.remove(
            "d-none"
        );

        if (returnPriceElement) {
            returnPriceElement.textContent =
                formatPaymentPrice(
                    returnPrice
                );
        }
    } else {
        returnRow?.classList.add(
            "d-none"
        );
    }
}


// =====================================================
// CARD INPUTS
// =====================================================

const cardHolder =
    document.querySelector(
        "#cardHolder"
    );

const cardNumber =
    document.querySelector(
        "#cardNumber"
    );

const cardExpiry =
    document.querySelector(
        "#cardExpiry"
    );

const cardCvv =
    document.querySelector(
        "#cardCvv"
    );


// =====================================================
// CARD NUMBER FORMAT
// =====================================================

cardNumber?.addEventListener(
    "input",
    event => {
        let value =
            event.target.value
                .replace(/\D/g, "")
                .slice(0, 16);

        event.target.value =
            value
                .replace(
                    /(.{4})/g,
                    "$1 "
                )
                .trim();
    }
);


// =====================================================
// CARD EXPIRY FORMAT
// =====================================================

cardExpiry?.addEventListener(
    "input",
    event => {
        let value =
            event.target.value
                .replace(/\D/g, "")
                .slice(0, 4);

        if (value.length >= 3) {
            value =
                `${value.slice(0, 2)}/` +
                `${value.slice(2)}`;
        }

        event.target.value =
            value;
    }
);


// =====================================================
// CVV FORMAT
// =====================================================

cardCvv?.addEventListener(
    "input",
    event => {
        event.target.value =
            event.target.value
                .replace(/\D/g, "")
                .slice(0, 3);
    }
);


// =====================================================
// BACK BUTTON
// =====================================================

document
    .querySelector("#paymentBackBtn")
    ?.addEventListener(
        "click",
        () => {
            window.location.href =
                "/Flights/Confirmation" +
                "?tripType=" +
                encodeURIComponent(
                    paymentTripType
                );
        }
    );


// =====================================================
// EXPIRY VALIDATION
// =====================================================

// Validate a card expiry in strict MM/YY format:
// - exactly two digits, a slash, two digits
// - month between 01 and 12
// - not in the past (current month counts as valid)
// YY is interpreted as a 2000s year (26 -> 2026).
function isValidCardExpiry(value) {
    const match = /^(\d{2})\/(\d{2})$/.exec(value || "");

    if (!match) {
        return false;
    }

    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);

    if (month < 1 || month > 12) {
        return false;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) {
        return false;
    }

    if (year === currentYear && month < currentMonth) {
        return false;
    }

    return true;
}


// =====================================================
// PAYMENT BUTTON
// =====================================================

const paymentCompleteBtn =
    document.querySelector("#paymentCompleteBtn");

let paymentRequestInProgress = false;

paymentCompleteBtn
    ?.addEventListener(
        "click",
        async () =>
        {
            if (paymentRequestInProgress) {
                return;
            }

            const cleanCardNumber =
                cardNumber?.value
                    .replace(/\s/g, "") ||
                "";

            if (
                !cardHolder?.value.trim() ||
                cleanCardNumber.length !== 16 ||
                !isValidCardExpiry(cardExpiry?.value) ||
                !/^\d{3}$/.test(cardCvv?.value || "")
            ) {
                alert(
                    "Lütfen kart bilgilerinizi eksiksiz girin."
                );

                return;
            }

            const searchData =
                getPaymentStorage("searchData");

            const passengerInfo =
                getPaymentStorage("passengerInfo");

            const departureFlight =
                getPaymentStorage("selectedDepartureFlight");

            const returnFlight =
                getPaymentStorage("selectedReturnFlight");

            const baggageSelection =
                getPaymentStorage("baggageSelection");

            const isRoundTrip = paymentTripType === "roundTrip";

            if (
                !searchData?.from || !searchData?.to ||
                !searchData?.departureDate || !searchData?.cabin ||
                !departureFlight?.searchFlightId ||
                !Array.isArray(passengerInfo?.passengers) ||
                passengerInfo.passengers.length === 0 ||
                !baggageSelection?.cabinBaggage?.type ||
                baggageSelection?.checkedBaggage?.kg == null ||
                (isRoundTrip && (!returnFlight?.searchFlightId || !searchData.returnDate))
            ) {
                alert("Rezervasyon bilgileri eksik. Lütfen önceki adımları kontrol edin.");
                return;
            }

            // Send only the reservation DTO fields. Card and price data stay out of the request.
            const request = {

                tripType: paymentTripType,

                from: searchData.from,
                to: searchData.to,

                departureDate: searchData.departureDate,
                returnDate: isRoundTrip ? searchData.returnDate : null,

                cabin: searchData.cabin,

                departureSearchFlightId: departureFlight.searchFlightId,
                returnSearchFlightId: isRoundTrip ? returnFlight.searchFlightId : null,

                contactFirstName: passengerInfo.contactFirstName,
                contactLastName: passengerInfo.contactLastName,
                contactEmail: passengerInfo.contactEmail,
                contactPhone: passengerInfo.contactPhone,

                passengers: passengerInfo.passengers.map(passenger => ({
                    passengerType: passenger.passengerType,
                    firstName: passenger.firstName,
                    lastName: passenger.lastName,
                    birthDate: passenger.birthDate,
                    gender: passenger.gender,
                    nationality: passenger.nationality,
                    nationalId: passenger.nationalId || null,
                    notTurkishCitizen: passenger.notTurkishCitizen,
                    hasPassport: passenger.hasPassport,
                    passportNumber: passenger.passportNumber || null,
                    passportExpiryDate: passenger.passportExpiryDate || null
                })),

                baggageSelection: {
                    cabinBaggageType: baggageSelection.cabinBaggage.type,
                    checkedBaggageKg: baggageSelection.checkedBaggage.kg
                }
            };

            paymentRequestInProgress = true;
            paymentCompleteBtn.disabled = true;

            try {
                const response = await fetch("/api/Reservations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(request)
                });

                const reservationResult = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(
                        reservationResult?.message ||
                        "Rezervasyon oluşturulamadı. Lütfen tekrar deneyin."
                    );
                }

                if (!reservationResult?.reservationId || !reservationResult?.pnr) {
                    throw new Error("Invalid reservation response.");
                }

                sessionStorage.setItem(
                    "reservationResult",
                    JSON.stringify(reservationResult)
                );

                window.location.href =
                    "/Flights/ReservationSuccess?tripType=" +
                    encodeURIComponent(paymentTripType);
            } catch (error) {
                alert(
                    error.message ||
                    "Rezervasyon oluşturulamadı. Lütfen tekrar deneyin."
                );
            } finally {
                paymentRequestInProgress = false;
                paymentCompleteBtn.disabled = false;
            }
        }
    );


// =====================================================
// INITIALIZE
// =====================================================

renderPaymentSummary();
