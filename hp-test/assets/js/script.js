(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const header = document.getElementById("header");
    const burger = document.getElementById("burger");
    const nav = document.getElementById("g-nav");
    const navInner = nav ? nav.querySelector(".nav-inner") : null;
    const navOverlay = nav ? nav.querySelector(".overlay") : null;
    const closeTriggers = nav ? nav.querySelectorAll("[data-close]") : [];
    const navListContainer = document.getElementById("nav-list");
    /* PATCH: 2025-10-02 */
    const sections = document.querySelectorAll("main section.scroll-point[id]");

    // 大学ロゴをPC用ヘッダーに複製
    const mobileLogo = document.querySelector(".logo-university img");
    const desktopLogo = document.querySelector(".logo-university-pc img");
    if (mobileLogo && desktopLogo) {
      desktopLogo.setAttribute("src", mobileLogo.getAttribute("src") || "");
      desktopLogo.setAttribute("alt", mobileLogo.getAttribute("alt") || "");
    }

    // グローバルナビをセクションから動的生成
    if (navListContainer && sections.length) {
      const navList = document.createElement("ul");
      sections.forEach((section) => {
        const title = section.getAttribute("data-title");
        if (!title) return;
        const listItem = document.createElement("li");
        const dataClass = section.getAttribute("data-class");
        const dataAccordion = section.getAttribute("data-accordion");
        if (dataClass) {
          listItem.classList.add(dataClass);
        }
        if (dataAccordion) {
          listItem.classList.add(dataAccordion);
        }
        const link = document.createElement("a");
        link.href = "#" + section.id;
        link.textContent = title;
        listItem.appendChild(link);
        navList.appendChild(listItem);
      });
      navListContainer.innerHTML = "";
      navListContainer.appendChild(navList);
    }

    // ハンバーガーメニュー制御
    let isMenuOpen = false;

    const setMenuState = (state) => {
      if (!nav || !navInner) return;
      isMenuOpen = state;
      body.classList.toggle("nav-open", state);
      body.style.overflow = state ? "hidden" : "";
      if (burger) {
        burger.setAttribute("aria-expanded", state ? "true" : "false");
      }
      if (state) {
        nav.style.display = "block";
        requestAnimationFrame(() => {
          if (navOverlay) {
            navOverlay.style.opacity = "1";
            navOverlay.style.pointerEvents = "auto";
          }
          navInner.style.transform = "translate3d(0, 0, 0)";
        });
      } else {
        if (navOverlay) {
          navOverlay.style.opacity = "0";
          navOverlay.style.pointerEvents = "none";
        }
        navInner.style.transform = "translate3d(100%, 0, 0)";
        const handleTransitionEnd = () => {
          if (!isMenuOpen && nav) {
            nav.style.display = "none";
          }
          navInner.removeEventListener("transitionend", handleTransitionEnd);
        };
        navInner.addEventListener("transitionend", handleTransitionEnd);
      }
    };

    const closeMenu = () => setMenuState(false);

    if (burger) {
      burger.addEventListener("click", () => {
        setMenuState(!isMenuOpen);
      });
    }

    closeTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        if (isMenuOpen) {
          closeMenu();
        }
      });
    });

    // スムーススクロール共通関数
    const scrollToTarget = (target) => {
      if (!target) return;
      const headerHeight = header ? header.offsetHeight : 0;
      const rect = target.getBoundingClientRect();
      const offset = Math.round(rect.top + window.scrollY - headerHeight);
      window.scrollTo({
        top: offset,
        behavior: "smooth",
      });
    };

    // ナビゲーションリンクのスムーススクロール
    const navLinks = document.querySelectorAll("#g-nav a[href^='#']");
    navLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href");
        if (!hash || hash === "#") return;
        const target = document.querySelector(hash);
        if (!target) return;
        event.preventDefault();
        scrollToTarget(target);
        if (window.innerWidth <= 768 && isMenuOpen) {
          closeMenu();
        }
      });
    });

    // ヒーローCTAのスクロール
    const heroCta = document.querySelector("[data-scroll-target]");
    if (heroCta) {
      heroCta.addEventListener("click", (event) => {
        const selector = heroCta.getAttribute("data-scroll-target");
        if (!selector) return;
        const target = document.querySelector(selector);
        if (!target) return;
        event.preventDefault();
        scrollToTarget(target);
      });
    }

    // スクロール位置に応じた現在地ハイライト
    const scrollPoints = document.querySelectorAll(".scroll-point");
    let sectionOffsets = [];

    const updateOffsets = () => {
      sectionOffsets = [];
      scrollPoints.forEach((point) => {
        const rect = point.getBoundingClientRect();
        const headerHeight = header ? header.offsetHeight : 0;
        sectionOffsets.push(Math.round(rect.top + window.scrollY - headerHeight));
      });
    };

    const updateCurrentNav = () => {
      const navItems = document.querySelectorAll("#g-nav .nav-default");
      if (!navItems.length || !sectionOffsets.length) return;
      const scroll = Math.round(window.scrollY);
      navItems.forEach((item) => {
        item.classList.remove("current");
      });
      let activeIndex = sectionOffsets.length - 1;
      for (let i = 0; i < sectionOffsets.length; i += 1) {
        const nextOffset = sectionOffsets[i + 1] ?? Number.POSITIVE_INFINITY;
        if (scroll >= sectionOffsets[i] && scroll < nextOffset) {
          activeIndex = i;
          break;
        }
      }
      navItems[activeIndex]?.classList.add("current");
    };

    window.addEventListener("load", () => {
      updateOffsets();
      updateCurrentNav();
    });

    window.addEventListener("resize", () => {
      updateOffsets();
      if (window.innerWidth > 768 && isMenuOpen) {
        closeMenu();
      }
    });

    window.addEventListener("scroll", () => {
      updateCurrentNav();
    });

    setTimeout(() => {
      updateOffsets();
      updateCurrentNav();
    }, 400);
  });
})();

