// =====================================================
// PAGE DATA
// =====================================================

const passengerUrlParams =
    new URLSearchParams(window.location.search);

const passengerTripType =
    passengerUrlParams.get("tripType") ||
    sessionStorage.getItem("tripType") ||
    "oneWay";

const passengerSelectionData =
    JSON.parse(sessionStorage.getItem("passengerSelection")) || {
        adults: 1,
        children: 0,
        infants: 0,
        totalPassengers: 1
    };

const passengersContainer =
    document.querySelector("#passengersContainer");


// =====================================================
// STORAGE HELPERS
// =====================================================

function getPassengerStorage(key) {
    const value = sessionStorage.getItem(key);

    if (!value) return null;

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

const savedPassengerInfo =
    getPassengerStorage("passengerInfo");

const passengerSearchData =
    getPassengerStorage("searchData");

// Build the flight reference date (departure date) used for age calculation.
// Returns null when unavailable so the age fallback (today) applies.
function getFlightReferenceDate() {
    const value =
        passengerSearchData &&
        passengerSearchData.departureDate;

    if (!value) {
        return null;
    }

    const parts = String(value).split("-");

    if (parts.length !== 3) {
        return null;
    }

    const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    return isNaN(date.getTime()) ? null : date;
}


// =====================================================
// GENERAL HELPERS
// =====================================================

function closeAllDateMenus(exceptMenu = null) {
    document
        .querySelectorAll(".custom-date-menu.open")
        .forEach(menu => {
            if (menu !== exceptMenu) {
                menu.classList.remove("open");
            }
        });
}

function createValidDate(year, month, day) {
    const numericYear = Number(year);
    const numericMonth = Number(month);
    const numericDay = Number(day);

    const date =
        new Date(
            numericYear,
            numericMonth - 1,
            numericDay
        );

    if (
        date.getFullYear() !== numericYear ||
        date.getMonth() !== numericMonth - 1 ||
        date.getDate() !== numericDay
    ) {
        return null;
    }

    return date;
}

function buildIsoDate(year, month, day) {
    return (
        `${year}-` +
        `${String(month).padStart(2, "0")}-` +
        `${String(day).padStart(2, "0")}`
    );
}

function calculatePassengerAge(birthDate, referenceDate) {
    // Reference date is the flight departure date; fall back to today only
    // when the search context is unavailable (defensive).
    const reference = referenceDate || new Date();

    let age =
        reference.getFullYear() -
        birthDate.getFullYear();

    const monthDifference =
        reference.getMonth() -
        birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            reference.getDate() < birthDate.getDate()
        )
    ) {
        age--;
    }

    return age;
}


// =====================================================
// RENDER PASSENGER CARDS
// =====================================================

function renderPassengerCards() {
    if (!passengersContainer) return;

    const firstCard =
        passengersContainer.querySelector(".passenger-card");

    if (!firstCard) return;

    const passengerTypes = [];

    // Add adult passengers
    for (
        let i = 0;
        i < passengerSelectionData.adults;
        i++
    ) {
        passengerTypes.push("Yetişkin");
    }

    // Add child passengers
    for (
        let i = 0;
        i < passengerSelectionData.children;
        i++
    ) {
        passengerTypes.push("Çocuk");
    }

    // Add infant passengers
    for (
        let i = 0;
        i < passengerSelectionData.infants;
        i++
    ) {
        passengerTypes.push("Bebek");
    }

    // Always keep at least one passenger card
    if (passengerTypes.length === 0) {
        passengerTypes.push("Yetişkin");
    }

    passengersContainer.innerHTML = "";

    passengerTypes.forEach((passengerType, index) => {
        const card =
            firstCard.cloneNode(true);

        card.dataset.passengerIndex = index;
        card.dataset.passengerType = passengerType;

        const title =
            card.querySelector(
                ".passenger-card-header h2"
            );

        const type =
            card.querySelector(
                ".passenger-card-header span"
            );

        if (title) {
            title.textContent =
                `${index + 1}. Yolcu`;
        }

        if (type) {
            type.textContent =
                passengerType;
        }

        // Make IDs unique for additional passenger cards
        if (index > 0) {
            card
                .querySelectorAll("[id]")
                .forEach(element => {
                    const oldId =
                        element.id;

                    const newId =
                        `${oldId}_${index}`;

                    element.id =
                        newId;

                    card
                        .querySelectorAll(
                            `label[for="${oldId}"]`
                        )
                        .forEach(label => {
                            label.setAttribute(
                                "for",
                                newId
                            );
                        });
                });
        }

        passengersContainer.appendChild(card);
    });
}


// =====================================================
// PASSENGER CARD CONTROLS
// =====================================================

function initializePassengerCard(card) {
    const notTurkishCitizen =
        card.querySelector(
            'input[id^="notTurkishCitizen"]'
        );

    const nationalId =
        card.querySelector(
            'input[id^="nationalId"]'
        );

    const hasPassport =
        card.querySelector(
            'input[id^="hasPassport"]'
        );

    const passportFields =
        card.querySelector(
            '[id^="passportFields"]'
        );

    // Enable or disable Turkish ID input
    function updateNationalId() {
        if (
            !notTurkishCitizen ||
            !nationalId
        ) {
            return;
        }

        if (notTurkishCitizen.checked) {
            nationalId.value = "";
            nationalId.disabled = true;
        } else {
            nationalId.disabled = false;
        }
    }

    // Show or hide passport fields
    function updatePassportFields() {
        if (
            !hasPassport ||
            !passportFields
        ) {
            return;
        }

        passportFields.classList.toggle(
            "d-none",
            !hasPassport.checked
        );
    }

    notTurkishCitizen?.addEventListener(
        "change",
        updateNationalId
    );

    hasPassport?.addEventListener(
        "change",
        updatePassportFields
    );

    // Set initial states
    updateNationalId();
    updatePassportFields();
}


// =====================================================
// BIRTH DATE CONTROLS
// =====================================================

function initializeBirthDate(card) {
    const dayTrigger =
        card.querySelector(
            'button[id^="birthDayTrigger"]'
        );

    const dayMenu =
        card.querySelector(
            'div[id^="birthDayMenu"]'
        );

    const dayInput =
        card.querySelector(
            'input[id^="birthDay"]'
        );

    const monthSelect =
        card.querySelector(
            'select[id^="birthMonth"]'
        );

    const yearTrigger =
        card.querySelector(
            'button[id^="birthYearTrigger"]'
        );

    const yearMenu =
        card.querySelector(
            'div[id^="birthYearMenu"]'
        );

    const yearInput =
        card.querySelector(
            'input[id^="birthYear"]'
        );

    if (
        !dayTrigger ||
        !dayMenu ||
        !dayInput ||
        !monthSelect ||
        !yearTrigger ||
        !yearMenu ||
        !yearInput
    ) {
        return;
    }

    // Populate birth months
    monthSelect.innerHTML = `
        <option value="">Ay</option>
        <option value="1">Ocak</option>
        <option value="2">Şubat</option>
        <option value="3">Mart</option>
        <option value="4">Nisan</option>
        <option value="5">Mayıs</option>
        <option value="6">Haziran</option>
        <option value="7">Temmuz</option>
        <option value="8">Ağustos</option>
        <option value="9">Eylül</option>
        <option value="10">Ekim</option>
        <option value="11">Kasım</option>
        <option value="12">Aralık</option>
    `;

    // Populate birth days
    dayMenu.innerHTML = "";

    for (let day = 1; day <= 31; day++) {
        const option =
            document.createElement("button");

        option.type = "button";
        option.className =
            "custom-date-option";

        option.textContent =
            day;

        option.addEventListener(
            "click",
            () => {
                dayInput.value =
                    day;

                const triggerText =
                    dayTrigger.querySelector("span");

                if (triggerText) {
                    triggerText.textContent =
                        day;
                }

                dayMenu.classList.remove("open");
            }
        );

        dayMenu.appendChild(option);
    }

    // Populate birth years
    yearMenu.innerHTML = "";

    const currentYear =
        new Date().getFullYear();

    for (
        let year = currentYear;
        year >= currentYear - 100;
        year--
    ) {
        const option =
            document.createElement("button");

        option.type = "button";
        option.className =
            "custom-date-option";

        option.textContent =
            year;

        option.addEventListener(
            "click",
            () => {
                yearInput.value =
                    year;

                const triggerText =
                    yearTrigger.querySelector("span");

                if (triggerText) {
                    triggerText.textContent =
                        year;
                }

                yearMenu.classList.remove("open");
            }
        );

        yearMenu.appendChild(option);
    }

    dayTrigger.addEventListener(
        "click",
        () => {
            const shouldOpen =
                !dayMenu.classList.contains("open");

            closeAllDateMenus();

            if (shouldOpen) {
                dayMenu.classList.add("open");
            }
        }
    );

    yearTrigger.addEventListener(
        "click",
        () => {
            const shouldOpen =
                !yearMenu.classList.contains("open");

            closeAllDateMenus();

            if (shouldOpen) {
                yearMenu.classList.add("open");
            }
        }
    );
}


// =====================================================
// PASSPORT EXPIRY DATE CONTROLS
// =====================================================

function initializePassportExpiryDate(card) {
    const dayTrigger =
        card.querySelector(
            'button[id^="passportExpiryDayTrigger"]'
        );

    const dayMenu =
        card.querySelector(
            'div[id^="passportExpiryDayMenu"]'
        );

    const dayInput =
        card.querySelector(
            'input[id^="passportExpiryDay"]'
        );

    const monthSelect =
        card.querySelector(
            'select[id^="passportExpiryMonth"]'
        );

    const yearTrigger =
        card.querySelector(
            'button[id^="passportExpiryYearTrigger"]'
        );

    const yearMenu =
        card.querySelector(
            'div[id^="passportExpiryYearMenu"]'
        );

    const yearInput =
        card.querySelector(
            'input[id^="passportExpiryYear"]'
        );

    const finalDateInput =
        card.querySelector(
            'input[id^="passportExpiryDate"]'
        );

    if (
        !dayTrigger ||
        !dayMenu ||
        !dayInput ||
        !monthSelect ||
        !yearTrigger ||
        !yearMenu ||
        !yearInput ||
        !finalDateInput
    ) {
        return;
    }

    // Combine passport date values into ISO format
    function updatePassportExpiryDate() {
        if (
            !dayInput.value ||
            !monthSelect.value ||
            !yearInput.value
        ) {
            finalDateInput.value = "";
            return;
        }

        finalDateInput.value =
            buildIsoDate(
                yearInput.value,
                monthSelect.value,
                dayInput.value
            );
    }

    // Populate passport months as numbers
    monthSelect.innerHTML =
        '<option value="">Ay</option>';

    for (
        let month = 1;
        month <= 12;
        month++
    ) {
        const option =
            document.createElement("option");

        option.value =
            month;

        option.textContent =
            month;

        monthSelect.appendChild(option);
    }

    // Populate passport days
    dayMenu.innerHTML = "";

    for (
        let day = 1;
        day <= 31;
        day++
    ) {
        const option =
            document.createElement("button");

        option.type = "button";
        option.className =
            "custom-date-option";

        option.textContent =
            day;

        option.addEventListener(
            "click",
            () => {
                dayInput.value =
                    day;

                const triggerText =
                    dayTrigger.querySelector("span");

                if (triggerText) {
                    triggerText.textContent =
                        day;
                }

                dayMenu.classList.remove("open");

                updatePassportExpiryDate();
            }
        );

        dayMenu.appendChild(option);
    }

    // Populate future passport years
    yearMenu.innerHTML = "";

    const currentYear =
        new Date().getFullYear();

    for (
        let year = currentYear;
        year <= currentYear + 15;
        year++
    ) {
        const option =
            document.createElement("button");

        option.type = "button";
        option.className =
            "custom-date-option";

        option.textContent =
            year;

        option.addEventListener(
            "click",
            () => {
                yearInput.value =
                    year;

                const triggerText =
                    yearTrigger.querySelector("span");

                if (triggerText) {
                    triggerText.textContent =
                        year;
                }

                yearMenu.classList.remove("open");

                updatePassportExpiryDate();
            }
        );

        yearMenu.appendChild(option);
    }

    monthSelect.addEventListener(
        "change",
        updatePassportExpiryDate
    );

    dayTrigger.addEventListener(
        "click",
        () => {
            const shouldOpen =
                !dayMenu.classList.contains("open");

            closeAllDateMenus();

            if (shouldOpen) {
                dayMenu.classList.add("open");
            }
        }
    );

    yearTrigger.addEventListener(
        "click",
        () => {
            const shouldOpen =
                !yearMenu.classList.contains("open");

            closeAllDateMenus();

            if (shouldOpen) {
                yearMenu.classList.add("open");
            }
        }
    );
}


// =====================================================
// RESTORE SAVED PASSENGER INFORMATION
// =====================================================

function restorePassengerInformation() {
    if (!savedPassengerInfo) return;

    const contactEmail =
        document.querySelector("#contactEmail");

    const contactPhone =
        document.querySelector("#contactPhone");

    if (contactEmail) {
        contactEmail.value =
            savedPassengerInfo.contactEmail || "";
    }

    if (contactPhone) {
        contactPhone.value =
            savedPassengerInfo.contactPhone || "";
    }

    const contactFirstName =
        document.querySelector("#contactFirstName");

    const contactLastName =
        document.querySelector("#contactLastName");

    if (contactFirstName) {
        contactFirstName.value =
            savedPassengerInfo.contactFirstName || "";
    }

    if (contactLastName) {
        contactLastName.value =
            savedPassengerInfo.contactLastName || "";
    }

    // Support both new and old saved structures
    const savedPassengers =
        savedPassengerInfo.passengers ||
        (
            savedPassengerInfo.passenger
                ? [savedPassengerInfo.passenger]
                : []
        );

    const passengerCards =
        document.querySelectorAll(
            "#passengersContainer .passenger-card"
        );

    passengerCards.forEach(
        (card, index) => {
            const passenger =
                savedPassengers[index];

            if (!passenger) return;

            const firstName =
                card.querySelector(
                    'input[id^="firstName"]'
                );

            const lastName =
                card.querySelector(
                    'input[id^="lastName"]'
                );

            const birthDay =
                card.querySelector(
                    'input[id^="birthDay"]'
                );

            const birthDayText =
                card.querySelector(
                    'button[id^="birthDayTrigger"] span'
                );

            const birthMonth =
                card.querySelector(
                    'select[id^="birthMonth"]'
                );

            const birthYear =
                card.querySelector(
                    'input[id^="birthYear"]'
                );

            const birthYearText =
                card.querySelector(
                    'button[id^="birthYearTrigger"] span'
                );

            const gender =
                card.querySelector(
                    'select[id^="gender"]'
                );

            const nationality =
                card.querySelector(
                    'select[id^="nationality"]'
                );

            const nationalId =
                card.querySelector(
                    'input[id^="nationalId"]'
                );

            const notTurkishCitizen =
                card.querySelector(
                    'input[id^="notTurkishCitizen"]'
                );

            const hasPassport =
                card.querySelector(
                    'input[id^="hasPassport"]'
                );

            const passportNumber =
                card.querySelector(
                    'input[id^="passportNumber"]'
                );

            const passportExpiryDate =
                card.querySelector(
                    'input[id^="passportExpiryDate"]'
                );

            const passportExpiryDay =
                card.querySelector(
                    'input[id^="passportExpiryDay"]'
                );

            const passportExpiryDayText =
                card.querySelector(
                    'button[id^="passportExpiryDayTrigger"] span'
                );

            const passportExpiryMonth =
                card.querySelector(
                    'select[id^="passportExpiryMonth"]'
                );

            const passportExpiryYear =
                card.querySelector(
                    'input[id^="passportExpiryYear"]'
                );

            const passportExpiryYearText =
                card.querySelector(
                    'button[id^="passportExpiryYearTrigger"] span'
                );

            // Restore basic passenger information
            if (firstName) {
                firstName.value =
                    passenger.firstName || "";
            }

            if (lastName) {
                lastName.value =
                    passenger.lastName || "";
            }

            if (gender) {
                gender.value =
                    passenger.gender || "";
            }

            if (nationality) {
                nationality.value =
                    passenger.nationality || "";
            }

            // Restore birth date
            if (
                birthDay &&
                passenger.birthDay
            ) {
                birthDay.value =
                    passenger.birthDay;

                if (birthDayText) {
                    birthDayText.textContent =
                        passenger.birthDay;
                }
            }

            if (birthMonth) {
                birthMonth.value =
                    passenger.birthMonth || "";
            }

            if (
                birthYear &&
                passenger.birthYear
            ) {
                birthYear.value =
                    passenger.birthYear;

                if (birthYearText) {
                    birthYearText.textContent =
                        passenger.birthYear;
                }
            }

            // Restore Turkish ID information
            if (notTurkishCitizen) {
                notTurkishCitizen.checked =
                    Boolean(
                        passenger.notTurkishCitizen
                    );
            }

            if (
                nationalId &&
                !passenger.notTurkishCitizen
            ) {
                nationalId.value =
                    passenger.nationalId || "";
            }

            // Restore passport information
            if (hasPassport) {
                hasPassport.checked =
                    Boolean(
                        passenger.hasPassport
                    );
            }

            if (
                passportNumber &&
                passenger.hasPassport
            ) {
                passportNumber.value =
                    passenger.passportNumber || "";
            }

            // Restore passport expiry date
            if (
                passenger.hasPassport &&
                passenger.passportExpiryDate
            ) {
                const dateParts =
                    passenger.passportExpiryDate.split("-");

                const year =
                    dateParts[0];

                const month =
                    dateParts[1];

                const day =
                    dateParts[2];

                if (passportExpiryDate) {
                    passportExpiryDate.value =
                        passenger.passportExpiryDate;
                }

                if (passportExpiryDay) {
                    passportExpiryDay.value =
                        Number(day);
                }

                if (passportExpiryDayText) {
                    passportExpiryDayText.textContent =
                        Number(day);
                }

                if (passportExpiryMonth) {
                    passportExpiryMonth.value =
                        Number(month);
                }

                if (passportExpiryYear) {
                    passportExpiryYear.value =
                        year;
                }

                if (passportExpiryYearText) {
                    passportExpiryYearText.textContent =
                        year;
                }
            }

            // Refresh checkbox-dependent fields
            notTurkishCitizen?.dispatchEvent(
                new Event("change")
            );

            hasPassport?.dispatchEvent(
                new Event("change")
            );
        }
    );
}


// =====================================================
// PASSENGER FORM
// =====================================================

const passengerForm =
    document.querySelector("#passengerForm");

const passengerContinueBtn =
    document.querySelector(
        ".passenger-continue-btn"
    );

if (
    passengerForm &&
    passengerContinueBtn
) {
    passengerContinueBtn.addEventListener(
        "click",
        () => {
            const contactFirstName =
                document.querySelector("#contactFirstName");

            const contactLastName =
                document.querySelector("#contactLastName");

            const contactEmail =
                document.querySelector("#contactEmail");

            const contactPhone =
                document.querySelector("#contactPhone");

            // Validate contact information
            if (!passengerForm.checkValidity()) {
                passengerForm.reportValidity();
                return;
            }

            if (
                !contactFirstName?.value.trim() ||
                !contactLastName?.value.trim() ||
                !contactEmail?.value.trim() ||
                !contactPhone?.value.trim()
            ) {
                alert(
                    "Lütfen iletişim bilgilerini eksiksiz doldurun."
                );
                return;
            }

            const passengerCards =
                document.querySelectorAll(
                    "#passengersContainer .passenger-card"
                );

            const passengers = [];

            for (const card of passengerCards) {
                const passengerNumber =
                    Number(
                        card.dataset.passengerIndex
                    ) + 1;

                const passengerType =
                    card.dataset.passengerType ||
                    "Yetişkin";

                const firstName =
                    card.querySelector(
                        'input[id^="firstName"]'
                    );

                const lastName =
                    card.querySelector(
                        'input[id^="lastName"]'
                    );

                const birthDay =
                    card.querySelector(
                        'input[id^="birthDay"]'
                    );

                const birthMonth =
                    card.querySelector(
                        'select[id^="birthMonth"]'
                    );

                const birthYear =
                    card.querySelector(
                        'input[id^="birthYear"]'
                    );

                const gender =
                    card.querySelector(
                        'select[id^="gender"]'
                    );

                const nationality =
                    card.querySelector(
                        'select[id^="nationality"]'
                    );

                const nationalId =
                    card.querySelector(
                        'input[id^="nationalId"]'
                    );

                const notTurkishCitizen =
                    card.querySelector(
                        'input[id^="notTurkishCitizen"]'
                    );

                const hasPassport =
                    card.querySelector(
                        'input[id^="hasPassport"]'
                    );

                const passportNumber =
                    card.querySelector(
                        'input[id^="passportNumber"]'
                    );

                const passportExpiryDate =
                    card.querySelector(
                        'input[id^="passportExpiryDate"]'
                    );

                // Validate required passenger fields
                if (
                    !firstName?.value.trim() ||
                    !lastName?.value.trim() ||
                    !birthDay?.value ||
                    !birthMonth?.value ||
                    !birthYear?.value ||
                    !gender?.value ||
                    !nationality?.value
                ) {
                    alert(
                        `${passengerNumber}. yolcunun bilgilerini eksiksiz doldurun.`
                    );
                    return;
                }

                // Validate birth date
                const birthDateObject =
                    createValidDate(
                        birthYear.value,
                        birthMonth.value,
                        birthDay.value
                    );

                if (!birthDateObject) {
                    alert(
                        `${passengerNumber}. yolcunun doğum tarihi geçerli değil.`
                    );
                    return;
                }

                const today =
                    new Date();

                today.setHours(
                    0,
                    0,
                    0,
                    0
                );

                if (birthDateObject > today) {
                    alert(
                        `${passengerNumber}. yolcunun doğum tarihi gelecekte olamaz.`
                    );
                    return;
                }

                const birthDate =
                    buildIsoDate(
                        birthYear.value,
                        birthMonth.value,
                        birthDay.value
                    );

                const passengerAge =
                    calculatePassengerAge(
                        birthDateObject,
                        getFlightReferenceDate()
                    );

                // Validate passenger age category
                if (
                    passengerType === "Bebek" &&
                    passengerAge >= 2
                ) {
                    alert(
                        `${passengerNumber}. yolcu Bebek olarak seçildi. Bebek yolcular 2 yaşından küçük olmalıdır.`
                    );
                    return;
                }

                if (
                    passengerType === "Çocuk" &&
                    (
                        passengerAge < 2 ||
                        passengerAge >= 12
                    )
                ) {
                    alert(
                        `${passengerNumber}. yolcu Çocuk olarak seçildi. Çocuk yolcular 2-11 yaş arasında olmalıdır.`
                    );
                    return;
                }

                if (
                    passengerType === "Yetişkin" &&
                    passengerAge < 12
                ) {
                    alert(
                        `${passengerNumber}. yolcu Yetişkin olarak seçildi. Yetişkin yolcular 12 yaş ve üzeri olmalıdır.`
                    );
                    return;
                }

                // Validate Turkish ID
                if (
                    !notTurkishCitizen?.checked &&
                    nationalId?.value.trim().length !== 11
                ) {
                    alert(
                        `${passengerNumber}. yolcunun T.C. Kimlik Numarası 11 haneli olmalıdır.`
                    );

                    nationalId?.focus();
                    return;
                }

                // Validate passport information
                if (hasPassport?.checked) {
                    if (
                        !passportNumber?.value.trim()
                    ) {
                        alert(
                            `${passengerNumber}. yolcunun pasaport numarasını girin.`
                        );

                        passportNumber?.focus();
                        return;
                    }

                    if (
                        !passportExpiryDate?.value
                    ) {
                        alert(
                            `${passengerNumber}. yolcunun pasaport geçerlilik tarihini seçin.`
                        );
                        return;
                    }

                    const passportParts =
                        passportExpiryDate.value
                            .split("-");

                    const expiryDate =
                        createValidDate(
                            passportParts[0],
                            passportParts[1],
                            passportParts[2]
                        );

                    if (!expiryDate) {
                        alert(
                            `${passengerNumber}. yolcunun pasaport geçerlilik tarihi geçerli değil.`
                        );
                        return;
                    }

                    if (expiryDate < today) {
                        alert(
                            `${passengerNumber}. yolcunun pasaport geçerlilik tarihi geçmiş olamaz.`
                        );
                        return;
                    }
                }

                // Add passenger to booking data
                passengers.push({
                    passengerType:
                        passengerType,

                    firstName:
                        firstName.value.trim(),

                    lastName:
                        lastName.value.trim(),

                    birthDay:
                        birthDay.value,

                    birthMonth:
                        birthMonth.value,

                    birthYear:
                        birthYear.value,

                    birthDate:
                        birthDate,

                    gender:
                        gender.value,

                    nationality:
                        nationality.value,

                    nationalId:
                        notTurkishCitizen?.checked
                            ? null
                            : nationalId?.value.trim(),

                    notTurkishCitizen:
                        Boolean(
                            notTurkishCitizen?.checked
                        ),

                    hasPassport:
                        Boolean(
                            hasPassport?.checked
                        ),

                    passportNumber:
                        hasPassport?.checked
                            ? passportNumber?.value.trim()
                            : null,

                    passportExpiryDate:
                        hasPassport?.checked
                            ? passportExpiryDate?.value
                            : null
                });
            }

            const passengerInfo = {
                contactFirstName:
                    contactFirstName.value.trim(),

                contactLastName:
                    contactLastName.value.trim(),

                contactEmail:
                    contactEmail.value.trim(),

                contactPhone:
                    contactPhone.value.trim(),

                passengers:
                    passengers
            };

            sessionStorage.setItem(
                "passengerInfo",
                JSON.stringify(passengerInfo)
            );

            sessionStorage.setItem(
                "tripType",
                passengerTripType
            );

            window.location.href =
                "/Flights/Baggage?tripType=" +
                encodeURIComponent(
                    passengerTripType
                );
        }
    );
}


// =====================================================
// CLOSE DATE MENUS
// =====================================================

document.addEventListener(
    "click",
    event => {
        if (
            !event.target.closest(
                ".custom-date-select"
            )
        ) {
            closeAllDateMenus();
        }
    }
);


// =====================================================
// INITIALIZE PAGE
// =====================================================

// Create passenger cards first
renderPassengerCards();

// Initialize Turkish ID and passport controls
document
    .querySelectorAll(
        "#passengersContainer .passenger-card"
    )
    .forEach(
        initializePassengerCard
    );

// Initialize birth date controls
document
    .querySelectorAll(
        "#passengersContainer .passenger-card"
    )
    .forEach(
        initializeBirthDate
    );

// Initialize passport expiry date controls
document
    .querySelectorAll(
        "#passengersContainer .passenger-card"
    )
    .forEach(
        initializePassportExpiryDate
    );

// Restore previously saved passenger information
restorePassengerInformation();