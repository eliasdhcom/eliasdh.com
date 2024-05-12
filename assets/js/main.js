/**
 * @author Elias De Hondt
 * @see https://eliasdh.com
 * @since 01/01/2020
 */

/* Content Loader */
function loadHTML(myDivId, url) {
    let xmlhttp;
    if (window.XMLHttpRequest) xmlhttp = new XMLHttpRequest();
    else xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
            if(xmlhttp.status == 200) {
                document.getElementById(myDivId).innerHTML = xmlhttp.responseText;
                let scripts = document.getElementById(myDivId).getElementsByTagName('script');
                for (let i = 0; i < scripts.length; i++) {
                    let script = document.createElement('script');
                    script.text = scripts[i].text;
                    document.body.appendChild(script);
                }
            }
        }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}
/* Content Loader */


/* Subtitle */
document.addEventListener('DOMContentLoaded', function() {
    function displayText(textArray, elementId, interval) {
        var currentIndex = 0;
        var currentText = textArray[currentIndex];
        var textElement = document.getElementById(elementId);
        var cursorPosition = 0;

        function displayNextText() {
            var i = 0;
            var intervalId = setInterval(function() {
                if (i < currentText.length) {
                    var word = currentText[i];
                    textElement.textContent += word;
                    textElement.innerHTML += '<span class="home-header-cursor"></span>';
                    cursorPosition++;
                    i++;
                } else {
                    clearInterval(intervalId);
                    setTimeout(function() {
                        removeCursor();
                        textElement.textContent = '';
                        currentIndex = (currentIndex + 1) % textArray.length;
                        currentText = textArray[currentIndex];
                        cursorPosition = 0;
                        setTimeout(displayNextText, interval * 2);
                    }, interval * 3);
                }
            }, interval);
        }

        function removeCursor() {
            var cursor = textElement.querySelector('.home-header-cursor');
            if (cursor) cursor.parentNode.removeChild(cursor);
        }

        displayNextText();
    }

    var texts = [
        "We are a company that", "provides hosting services.",
        "And other services related", "to web development.",
        "We are here to help", "you with your online presence.",
        "Tell us what you need", "and we will make it happen."
    ];

    displayText(texts, 'home-header-subtitle', 100); // 100ms interval
});
/* Subtitle */

/* Team */
document.addEventListener("DOMContentLoaded", function () {
    const carouselItems = document.querySelectorAll(".home-team-container-carousel-item");
    if (window.innerWidth < 768) totalItems = carouselItems.length;
    else totalItems = carouselItems.length-2;
    
    const itemsToShow = 3; // Number of items to show at once
    let currentIndex = 0;

    function showItems(startIndex) {
        carouselItems.forEach((item, i) => {
            if (window.innerWidth < 768) { // Mobile (1 item per keer)
                if (i === startIndex) {
                    item.classList.add("home-team-container-carousel-item-active");
                } else {
                    item.classList.remove("home-team-container-carousel-item-active");
                }
            } else { // Desktop (3 items per keer)
                if (i >= startIndex && i < startIndex + itemsToShow) {
                    item.classList.add("home-team-container-carousel-item-active");
                } else {
                    item.classList.remove("home-team-container-carousel-item-active");
                }
            }
        });
    }

    function nextItem() {
        currentIndex = (currentIndex + 1) % totalItems;
        showItems(currentIndex);
    }

    showItems(currentIndex);

    setInterval(nextItem, 5000); // 5 seconden interval
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("home-team-emailIcon").addEventListener("click", function () {
        window.location.href = "mailto:info@eliasdh.com?SUBJECT=Join%20our%20team&BODY=Dear%20EliasDH%20Team";
    });
});
/* Team */