/**
 * @author Elias De Hondt
 * @see https://eliasdh.com
 * @since 01/01/2020
 */

/* Carousel */
document.addEventListener("DOMContentLoaded", function () {
    const carouselItems = document.querySelectorAll(".carousel-item");
    const totalItems = carouselItems.length;
    let currentIndex = 0;

    function showItems(index) {
        const nextIndex = (index + 1) % totalItems;
        carouselItems.forEach((item, i) => {
            if (i === index || i === nextIndex) {
                item.classList.remove("inactive");
                item.classList.add("active");
            } else {
                item.classList.remove("active");
                item.classList.add("inactive")
            }
        });
    }

    function nextItem() {
        currentIndex = (currentIndex + 1) % totalItems;
        showItems(currentIndex);
    }

    function autoNextItem() {
        nextItem();
    }

    showItems(currentIndex);

    setInterval(autoNextItem, 5000);
});
/* Carousel */