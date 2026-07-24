(() => {
    "use strict";

    const body = document.body;
    const root = document.documentElement;
    const slides = Array.from(document.querySelectorAll(".slide"));
    const currentSlideLabel = document.getElementById("currentSlide");
    const totalSlidesLabel = document.getElementById("totalSlides");
    const currentSectionLabel = document.getElementById("currentSection");
    const progressTrack = document.getElementById("progressTrack");
    const progressFill = document.getElementById("progressFill");
    const previousButton = document.getElementById("previousButton");
    const nextButton = document.getElementById("nextButton");
    const languageButton = document.getElementById("languageButton");
    const languageLabel = document.getElementById("languageLabel");
    const fullscreenButton = document.getElementById("fullscreenButton");
    const printButton = document.getElementById("printButton");
    const contentsButton = document.getElementById("contentsButton");
    const contentsDialog = document.getElementById("contentsDialog");
    const closeContentsButton = document.getElementById("closeContentsButton");
    const contentsItems = Array.from(document.querySelectorAll("[data-slide]"));
    const screenshot = document.getElementById("familyAppScreenshot");
    const languageStorageKey = "al-naser-proposal-language-v2";

    let currentIndex = 0;
    let language = "ar";
    let wheelLocked = false;
    let pointerStartX = 0;
    let pointerStartY = 0;

    const pad = (value) => String(value).padStart(2, "0");

    const readInitialIndex = () => {
        const match = window.location.hash.match(/slide-(\d+)/i);
        if (!match) return 0;
        return Math.min(Math.max(Number(match[1]) - 1, 0), slides.length - 1);
    };

    const readInitialLanguage = () => {
        const stored = window.localStorage.getItem(languageStorageKey);
        return stored === "en" ? "en" : "ar";
    };

    const updateScreenshotState = () => {
        if (!screenshot) return;
        const shell = screenshot.closest(".phone-shell");
        shell?.classList.toggle("screenshot-missing", !screenshot.naturalWidth);
    };

    const updateLanguage = (nextLanguage, persist = true) => {
        language = nextLanguage === "ar" ? "ar" : "en";
        body.dataset.lang = language;
        root.lang = language;
        root.dir = language === "ar" ? "rtl" : "ltr";
        languageLabel.textContent = language === "en" ? "العربية" : "English";
        languageButton.setAttribute(
            "aria-label",
            language === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"
        );
        previousButton.setAttribute(
            "aria-label",
            language === "ar" ? "الشريحة السابقة" : "Previous slide"
        );
        nextButton.setAttribute(
            "aria-label",
            language === "ar" ? "الشريحة التالية" : "Next slide"
        );
        document.title =
            language === "en"
                ? "Al Naser Family App Proposal — Abdullah Alamzyad"
                : "مقترح تطبيق الناصر — عبدالله المزيد";

        if (persist) {
            window.localStorage.setItem(languageStorageKey, language);
        }
        render();
    };

    const render = () => {
        slides.forEach((slide, index) => {
            slide.classList.toggle("is-active", index === currentIndex);
            slide.classList.toggle("is-before", index < currentIndex);
            slide.setAttribute("aria-hidden", index === currentIndex ? "false" : "true");
        });

        const activeSlide = slides[currentIndex];
        const section =
            language === "ar"
                ? activeSlide.dataset.sectionAr
                : activeSlide.dataset.sectionEn;

        currentSlideLabel.textContent = pad(currentIndex + 1);
        totalSlidesLabel.textContent = pad(slides.length);
        currentSectionLabel.textContent = section;
        progressFill.style.width = `${((currentIndex + 1) / slides.length) * 100}%`;
        previousButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex === slides.length - 1;

        contentsItems.forEach((item) => {
            item.classList.toggle("is-current", Number(item.dataset.slide) === currentIndex);
        });

        activeSlide.scrollTo({ top: 0, behavior: "instant" });
        window.history.replaceState(null, "", `#slide-${pad(currentIndex + 1)}`);
    };

    const goTo = (index) => {
        const nextIndex = Math.min(Math.max(index, 0), slides.length - 1);
        if (nextIndex === currentIndex) return;
        currentIndex = nextIndex;
        render();
    };

    const goNext = () => goTo(currentIndex + 1);
    const goPrevious = () => goTo(currentIndex - 1);

    previousButton.addEventListener("click", goPrevious);
    nextButton.addEventListener("click", goNext);

    document.querySelectorAll("[data-go]").forEach((button) => {
        button.addEventListener("click", () => goTo(Number(button.dataset.go)));
    });

    languageButton.addEventListener("click", () => {
        updateLanguage(language === "en" ? "ar" : "en");
    });

    printButton?.addEventListener("click", () => window.print());

    fullscreenButton.addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch {
            // Fullscreen can be blocked when the page is opened in a restricted preview.
        }
    });

    document.addEventListener("fullscreenchange", () => {
        fullscreenButton.setAttribute(
            "aria-label",
            document.fullscreenElement
                ? language === "ar"
                    ? "الخروج من ملء الشاشة"
                    : "Exit fullscreen"
                : language === "ar"
                    ? "عرض بملء الشاشة"
                    : "Enter fullscreen"
        );
    });

    contentsButton.addEventListener("click", () => {
        if (typeof contentsDialog.showModal === "function") {
            contentsDialog.showModal();
        } else {
            contentsDialog.setAttribute("open", "");
        }
    });

    const closeContents = () => {
        if (typeof contentsDialog.close === "function") {
            contentsDialog.close();
        } else {
            contentsDialog.removeAttribute("open");
        }
    };

    closeContentsButton.addEventListener("click", closeContents);

    contentsDialog.addEventListener("click", (event) => {
        if (event.target === contentsDialog) closeContents();
    });

    contentsItems.forEach((item) => {
        item.addEventListener("click", () => {
            goTo(Number(item.dataset.slide));
            closeContents();
        });
    });

    progressTrack.addEventListener("click", (event) => {
        const bounds = progressTrack.getBoundingClientRect();
        let ratio = (event.clientX - bounds.left) / bounds.width;
        if (language === "ar") ratio = 1 - ratio;
        goTo(Math.round(ratio * (slides.length - 1)));
    });

    document.addEventListener("keydown", (event) => {
        if (event.defaultPrevented) return;
        if (contentsDialog.open && event.key !== "Escape") return;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

        if (event.key === "ArrowRight") {
            event.preventDefault();
            if (language === "ar") goPrevious();
            else goNext();
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (language === "ar") goNext();
            else goPrevious();
        } else if (["ArrowDown", "PageDown", " "].includes(event.key)) {
            event.preventDefault();
            goNext();
        } else if (["ArrowUp", "PageUp"].includes(event.key)) {
            event.preventDefault();
            goPrevious();
        } else if (event.key === "Home") {
            event.preventDefault();
            goTo(0);
        } else if (event.key === "End") {
            event.preventDefault();
            goTo(slides.length - 1);
        } else if (event.key.toLowerCase() === "l") {
            updateLanguage(language === "en" ? "ar" : "en");
        } else if (event.key.toLowerCase() === "f") {
            fullscreenButton.click();
        }
    });

    document.addEventListener(
        "wheel",
        (event) => {
            if (window.matchMedia("(max-width: 980px), (max-aspect-ratio: 5 / 4)").matches) {
                return;
            }
            if (contentsDialog.open || wheelLocked || Math.abs(event.deltaY) < 28) return;

            wheelLocked = true;
            if (event.deltaY > 0) goNext();
            else goPrevious();
            window.setTimeout(() => {
                wheelLocked = false;
            }, 650);
        },
        { passive: true }
    );

    document.addEventListener(
        "touchstart",
        (event) => {
            const touch = event.changedTouches[0];
            pointerStartX = touch.clientX;
            pointerStartY = touch.clientY;
        },
        { passive: true }
    );

    document.addEventListener(
        "touchend",
        (event) => {
            if (contentsDialog.open) return;
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - pointerStartX;
            const deltaY = touch.clientY - pointerStartY;

            if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
                const isNextSwipe = language === "ar" ? deltaX > 0 : deltaX < 0;
                if (isNextSwipe) goNext();
                else goPrevious();
            }
        },
        { passive: true }
    );

    window.addEventListener("hashchange", () => {
        const requestedIndex = readInitialIndex();
        if (requestedIndex !== currentIndex) {
            currentIndex = requestedIndex;
            render();
        }
    });

    screenshot?.addEventListener("load", updateScreenshotState);
    screenshot?.addEventListener("error", updateScreenshotState);

    currentIndex = readInitialIndex();
    updateLanguage(readInitialLanguage(), false);
    updateScreenshotState();
})();
