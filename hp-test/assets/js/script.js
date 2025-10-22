(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    // ... (大學ロゴ複製, グローバルナビ生成 - keep these)

    // @@@@ コンテンツのセクションを見てグローバルナビに項目を生成
    const globalNav = document.getElementById("nav-list");
    const sections = document.querySelectorAll("section.scroll-point");
    const navMap = new Map();
    function createGlobalNav() {
      const navList = document.createElement("ul");
      sections.forEach((section) => {
        const sectionTitle = section.getAttribute("data-title");
        const sectionUniqeClass = section.getAttribute("data-class");
        const sectionIsAccordion = section.getAttribute("data-accordion");

        const navItem = document.createElement("li");
        if (sectionUniqeClass) navItem.classList.add(sectionUniqeClass);
        if (sectionIsAccordion) navItem.classList.add(sectionIsAccordion);
        navItem.classList.add("nav-item");
        navItem.dataset.target = section.id;
        const link = document.createElement("a");
        link.href = `#${section.id}`;
        link.textContent = sectionTitle || section.id;

        if (sectionIsAccordion === "nav-drop") {
          const dropDiv = document.createElement("div");
          dropDiv.classList.add("nav-drop-main");
          dropDiv.appendChild(link);

          const dropdownImg = document.createElement("div");
          dropdownImg.innerHTML =
            '<img src="./assets/images/ico/no-farames/ico-dropdown.svg" />';

          const ul = document.createElement("ul");

          navItem.appendChild(dropDiv);
          dropDiv.appendChild(dropdownImg);
          navItem.appendChild(ul);
        } else {
          navItem.appendChild(link);
        }

        navList.appendChild(navItem);
        navMap.set(section.id, navItem);
      });

      if (globalNav) globalNav.appendChild(navList);
    }

    createGlobalNav();

    // 各 nav-drop セクションごとにサブメニュー生成 (keep this)
    sections.forEach((section) => {
      const isDrop = section.getAttribute("data-accordion") === "nav-drop";
      if (!isDrop) return;
      const navLi = navMap.get(section.id);
      if (!navLi) return;
      const accordionWrapp = navLi.querySelector("ul");
      if (!accordionWrapp) return;
      const dropSlides = section.querySelectorAll(".tab-wrapp .swiper-slide");
      dropSlides.forEach((dropSlide, index) => {
        const acoItem = document.createElement("li");
        const acoHref = document.createElement("a");
        acoHref.href = `#${section.id}`;
        acoHref.textContent = dropSlide.getAttribute("data-index") || `Tab ${index + 1}`;
        acoItem.setAttribute("data-slide", index + 1);
        acoItem.appendChild(acoHref);
        accordionWrapp.appendChild(acoItem);
      });
    });

    // @@@@@ windowリサイズ時にリロードをさせる (Modify this - see next point)
    const breakPoint = 769;
    let resizeFlag;
    window.addEventListener(
      "load",
      () => {
        if (breakPoint < window.innerWidth) {
          resizeFlag = false;
        } else {
          resizeFlag = true;
        }
        // Removed the call to resizeWindow() here
      },
      false
    );

    // Modify resizeWindow logic for more robust handling
    let currentResizeState;
    const handleResize = () => {
        const newResizeState = window.innerWidth < breakPoint; // true for mobile, false for desktop
        if (currentResizeState !== undefined && newResizeState !== currentResizeState) {
            window.location.reload();
        }
        currentResizeState = newResizeState;
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('load', handleResize); // Also check on load

    // バーガーメニュー (keep this block - see next point for mobile menu closing)

    // IntersectionObserver によるスクロール連動ハイライト (Keep and modify slightly)
    const observedSections = document.querySelectorAll("section.scroll-point");
    const getHeaderH = () => {
      const header = document.getElementById("header");
      return header ? header.offsetHeight : 0;
    };
    const visibleRatios = new Map();

    // Function to update current class based on IntersectionObserver data
    function updateCurrentByIntersection() {
      let maxId = null;
      let maxRatio = 0;
      observedSections.forEach((sec) => {
        const ratio = visibleRatios.get(sec.id) || 0;
        if (ratio > maxRatio) {
          maxRatio = ratio;
          maxId = sec.id;
        }
      });

      // If no section is significantly visible, maybe default to the first one or no highlight
      if (!maxId && observedSections.length > 0) {
          maxId = observedSections[0].id; // Or handle as per design
      }
      if (!maxId) return;

      document
        .querySelectorAll("#g-nav .nav-item.current")
        .forEach((el) => el.classList.remove("current"));
      const li = navMap.get(maxId);
      if (li) li.classList.add("current");
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          // Store ratio only if intersecting
          visibleRatios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        updateCurrentByIntersection();
      },
      {
        root: null,
        // Adjust thresholds based on how much of the section should be visible to be considered "current"
        threshold: [0, 0.2, 0.5, 0.8, 1.0],
        rootMargin: `-${getHeaderH()}px 0px 0px 0px`,
      }
    );
    observedSections.forEach((s) => io.observe(s));

    // @@@@ ナビゲーションをセクションのスクロールと連動させてカレントを付け替える (REMOVE this block)
    // 基準点の準備
    // var elemTop = [];
    // function PositionCheck() { ... }
    // function ScrollAnime() { ... }

    // ナビゲーションをクリックした際のスムーススクロール (Keep, but consider using scrollIntoView)
    var navLinks = document.querySelectorAll("#g-nav a");
    navLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        const elmHash = this.getAttribute("href");
        const targetElement = document.querySelector(elmHash);

        if (targetElement) {
          event.preventDefault();
          const header = document.getElementById("header");
          const headerH = header ? header.offsetHeight : 0; // Ensure header exists

          // Using scrollIntoView with scroll-margin-top CSS is generally more robust
          targetElement.style.scrollMarginTop = `${headerH}px`;
          targetElement.scrollIntoView({
            behavior: "smooth"
          });

          // Remove the temporary scroll-margin-top after scrolling (optional, can also be handled purely in CSS)
          // setTimeout(() => {
          //     targetElement.style.scrollMarginTop = '';
          // }, 1000); // Adjust timeout as needed
        }
      });
    });


    // @@@@@ アコーディオン
    const accordionButtons = document.querySelectorAll(".nav-drop-main");

    accordionButtons.forEach((accordionBtn, index) => {
      accordionBtn.addEventListener("click", (e) => {
        const parentLi = e.target.closest("li");
        const content = parentLi.querySelector("ul");
        const isOpen = parentLi.classList.toggle("is-active");
        if (isOpen) {
          content.style.height = "auto";
          const h = content.offsetHeight;
          content.style.height = "0";
          content.style.transition = "height 300ms";
          content.offsetHeight;
          content.style.height = h + "px";
        } else {
          content.style.height = "0";
        }
        accordionButtons.forEach((btn, i) => {
          if (i !== index) {
            btn.closest("li").classList.remove("is-active");
            btn.nextElementSibling.style.height = "0";
          }
        });
        const container = parentLi.closest(".scroll-control");
        if (container !== null) {
          container.classList.toggle("is-active", isOpen);
        }
      });
    });

    // @@@@ タブスライド
    var pvs;
    var tabLength = document.querySelectorAll(".mySwiper .swiper-slide").length;

    if (tabLength > 4) {
      pvs = "4.5";
    } else {
      pvs = tabLength;
    }

    var swiper = new Swiper(".mySwiper", {
      slidesPerView: pvs,
      watchSlidesProgress: true,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      on: {
        init: () => {
          const navLinks = document.querySelectorAll(".nav-drop ul li");
          navLinks.forEach((link) => {
            link.addEventListener("click", (event) => {
              event.preventDefault();
              const slideNumber = link.getAttribute("data-slide");
              swiper2.slideTo(slideNumber - 1);
            });
          });
          // moreボタン
        },
      },
    });
    var swiper2 = new Swiper(".mySwiper2", {
      spaceBetween: 10,
      autoHeight: true,
      simulateTouch: false,
      thumbs: {
        swiper: swiper,
      },
    });

    const num = 6;
    const swiperWrap = document.querySelectorAll(".swiper-slide");

    for (var i = 0; i < swiperWrap.length; i++) {
      const swiperItemLists = swiperWrap[i].querySelectorAll(
        ".swiper-slide ul li"
      );
      // listを一旦非表示
      for (var e = num; e < swiperItemLists.length; e++) {
        swiperItemLists[e].classList.add("is-hidden");
      }
    }
    const swiperBtns = document.querySelectorAll(".load-more");
    swiperBtns.forEach((swiperBtn, i) => {
      swiperBtn.addEventListener("click", () => {
        const wrap = swiperBtn.parentElement.querySelector("ul");
        const hiddenItems = wrap.querySelectorAll("li.is-hidden");
        for (var i = 0; i < num && i < hiddenItems.length; i++) {
          hiddenItems[i].classList.remove("is-hidden");
        }
        if (wrap.querySelectorAll("li.is-hidden").length === 0) {
          swiperBtn.style.display = "none";
        }
      });
    });

    setTimeout(() => {
      swiper2.update();
    }, 450);

    // function initSlideMoreButton(slideIndex) {
    //   const currentSlide = swiper2.slides[slideIndex];
    //   const loadMoreButton = currentSlide.querySelector(".load-more");
    //   const listItems = currentSlide.querySelectorAll(".list-item");
    //   const itemsToShow = 6;
    //   let currentItemIndex = itemsToShow;

    //   if (listItems.length <= itemsToShow) {
    //     loadMoreButton.style.display = "none";
    //   }

    //   function toggleListItems() {
    //     for (let i = 0; i < listItems.length; i++) {
    //       if (i < currentItemIndex) {
    //         listItems[i].style.display = "block";
    //       } else {
    //         listItems[i].style.display = "none";
    //       }
    //     }
    //   }

    //   toggleListItems();

    //   loadMoreButton.addEventListener("click", function () {
    //     currentItemIndex += itemsToShow;
    //     toggleListItems();
    //     if (currentItemIndex >= listItems.length) {
    //       loadMoreButton.style.display = "none";
    //     }
    //   });
    // }

    // initSlideMoreButton(0); // 初期化

    // initSlideMoreButton(swiper2.activeIndex);

    // function initSlideMoreButton(slideIndex) {
    //   const currentSlide = swiper2.slides[slideIndex];
    //   const loadMoreButton = currentSlide.querySelector(".load-more");
    //   const listItems = currentSlide.querySelectorAll(".list-item");
    //   const itemsToShow = 6; // 1回に表示するアイテム数
    //   let currentItemIndex = itemsToShow;

    //   if (listItems.length <= itemsToShow) {
    //     loadMoreButton.style.display = "none";
    //   }

    //   function toggleListItems() {
    //     for (let i = 0; i < listItems.length; i++) {
    //       if (i < currentItemIndex) {
    //         listItems[i].style.display = "block";
    //       } else {
    //         listItems[i].style.display = "none";
    //       }
    //     }
    //   }

    //   toggleListItems(); // 初期表示

    //   loadMoreButton.addEventListener("click", function () {
    //     currentItemIndex += itemsToShow;
    //     toggleListItems();
    //     if (currentItemIndex >= listItems.length) {
    //       loadMoreButton.style.display = "none";
    //     }
    //   });
    // }

    // @@@@ もっと見るボタン
    function setupMoreButton(sectionSelector, moreNum) {
      var section = document.querySelector(sectionSelector);
      var listItems = section.querySelectorAll("[data-more]");
      var listBtn = section.querySelector(".more-btn");

      for (var i = moreNum; i < listItems.length; i++) {
        listItems[i].classList.add("is-hidden");
      }

      listBtn.addEventListener("click", function () {
        var hiddenItems = section.querySelectorAll("[data-more].is-hidden");

        for (var i = 0; i < moreNum && i < hiddenItems.length; i++) {
          hiddenItems[i].classList.remove("is-hidden");
          hiddenItems[i].classList.add("is-visible");
          hiddenItems[i].style.display = "block";
          hiddenItems[i].style.opacity = 1;
        }

        if (section.querySelectorAll("[data-more].is-hidden").length === 0) {
          listBtn.style.display = "none";
        }
      });

      document.addEventListener("DOMContentLoaded", function () {
        var list = section.querySelectorAll(".list li").length;
        if (list < moreNum) {
          listBtn.classList.add("is-btn-hidden");
        }
      });
    }
    setupMoreButton("#news", 3);
    setupMoreButton("#member", 2);

    // @@@@@ メールのコピー
    const copyButton = document.getElementById("contact-btn");
    const tagText = document.getElementById("tagText");
    const message = document.getElementById("message");

    copyButton.addEventListener("click", () => {
      const tagValue = tagText.value;
      copyToClipboard(tagValue);
    });

    async function copyToClipboard(tagValue) {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(tagValue);
        } else {
          document.execCommand("copy");
        }

        messageActive();
      } catch (error) {
        console.error("クリップボードへのコピーに失敗しました:", error);
      }
    }

    function messageActive() {
      message.classList.add("is-active");
      setTimeout(() => {
        message.classList.remove("is-active");
      }, 1600);
    }
  });
})();
