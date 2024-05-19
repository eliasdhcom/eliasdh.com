/**
 * @author Elias De Hondt
 * @see https://eliasdh.com
 * @since 01/01/2020
 */

/* Home Page */
if (window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname === '/index.php') {
    /* Subtitle */
    document.addEventListener('DOMContentLoaded', function() {
        var currentDisplayInterval;

        function displayText(textArray, elementId, interval) {
            var currentIndex = 0;
            var currentText = textArray[currentIndex];
            var textElement = document.getElementById(elementId);
            var cursorPosition = 0;

            function displayNextText() {
                var i = 0;
                currentDisplayInterval = setInterval(function() {
                    if (i < currentText.length) {
                        var word = currentText[i];
                        textElement.textContent += word;
                        textElement.innerHTML += '<span class="home-header-cursor"></span>';
                        cursorPosition++;
                        i++;
                    } else {
                        clearInterval(currentDisplayInterval);
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

            function stopCurrentAnimation() {
                clearInterval(currentDisplayInterval);
                textElement.textContent = '';
                removeCursor();
            }

            stopCurrentAnimation();
            displayNextText();
        }

        displayText(texts, 'home-header-subtitle', 100);
        window.displayText = displayText;
    });
    /* Subtitle */

    /* Team */
    document.addEventListener("DOMContentLoaded", function () {
        const carouselItems = document.querySelectorAll(".home-team-container-carousel-item");
        let totalItems;

        if (window.innerWidth >= 1300) totalItems = carouselItems.length - 2; // Desktop (3 items)
        else if (window.innerWidth >= 768) totalItems = carouselItems.length - 1; // iPad (2 items)
        else totalItems = carouselItems.length; // Telefoon (1 item)

        const itemsToShow = window.innerWidth >= 1300 ? 3 : (window.innerWidth >= 768 ? 2 : 1); // Number of items to show at once
        let currentIndex = 0;

        function showItems(startIndex) {
            carouselItems.forEach((item, i) => {
                if (window.innerWidth >= 1300) { // Desktop (3 items)
                    if (i >= startIndex && i < startIndex + itemsToShow) item.classList.add("home-team-container-carousel-item-active");
                    else item.classList.remove("home-team-container-carousel-item-active");
                } else if (window.innerWidth >= 768) { // iPad (2 items)
                    if (i >= startIndex && i < startIndex + itemsToShow) item.classList.add("home-team-container-carousel-item-active");
                    else item.classList.remove("home-team-container-carousel-item-active");
                } else { // Telefoon (1 item)
                    if (i === startIndex) item.classList.add("home-team-container-carousel-item-active");
                    else item.classList.remove("home-team-container-carousel-item-active");
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
}

/* Content Loader */
function loadExternalContent(DivId, url) {
    let xmlhttp;
    if (window.XMLHttpRequest) xmlhttp = new XMLHttpRequest();
    else xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
            if(xmlhttp.status == 200) {
                document.getElementById(DivId).innerHTML = xmlhttp.responseText;
                let scripts = document.getElementById(DivId).getElementsByTagName('script');
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

/* Context Menu */
let selectedText = '';
let contextMenu = '';
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('contextmenu', (event) => {
        if (window.innerWidth < 768) return; // Disable context menu on mobile devices
        event.preventDefault();
        selectedText = window.getSelection().toString(); // Get selected text (For copySelectedText function)
        contextMenu = document.getElementById('context-menu');
        let top = parseInt(contextMenu.style.top);
        let left = parseInt(contextMenu.style.left);

        if (isNaN(top)) top = 0;
        if (isNaN(left)) left = 0;

        if (window.scrollY !== 0) top = event.clientY + window.scrollY;
        else top = event.clientY;

        if (window.scrollX !== 0) left = event.clientX + window.scrollX;
        else left = event.clientX;

        contextMenu.style.top = top + 'px';
        contextMenu.style.left = left + 'px';
        contextMenu.style.display = 'block';

        document.addEventListener('click', (clickEvent) => {
            if (!contextMenu.contains(clickEvent.target)) contextMenu.style.display = 'none';
        });
    });
});

// Copy the current URL to clipboard.
function copyLinkAddress() {
    navigator.clipboard.writeText(window.location.href);
    contextMenu.style.display = 'none';
}

// Copy the selected text to clipboard.
function copySelectedText() {
    if (selectedText) navigator.clipboard.writeText(selectedText);
    contextMenu.style.display = 'none';
}

// Set dark mode.
function darkMode() {
    document.body.classList.add('context-menu-dark-mode');
    document.getElementById('darkMode').style.display = 'none';
    document.getElementById('lightMode').style.display = 'flex';
    contextMenu.style.display = 'none';
}

// Set light mode.
function lightMode() {
    document.body.classList.remove('context-menu-dark-mode');
    document.getElementById('darkMode').style.display = 'flex';
    document.getElementById('lightMode').style.display = 'none';
    contextMenu.style.display = 'none';
}
/* Context Menu */

/* Footer */
function setJavaScriptFooter() {
    document.getElementById("footer-year").textContent = new Date().getFullYear();
}
/* Footer */

/* Navigation */
function setJavaScriptNavigation() {
    if (window.innerWidth < 768) return;

    document.getElementById('navigationIcon').addEventListener('click', function() {
        const navigationList = document.getElementById('navigationList');
        if (navigationList.style.visibility === 'visible') {
            navigationList.style.visibility = 'hidden';
        } else {
            navigationList.style.visibility = 'visible';
        }
    });
}
/* Navigation */

/* Http Code */
if (window.location.pathname === '/assets/pages/403.html') {
    var hand = document.getElementById('httpcode-policeman-hand');

    isHandRotated = false;
    hand.style.transformOrigin = 'left bottom';
    hand.style.transition = 'transform 0.4s';

    function rotateHandLeft() {
        isHandRotated = false;
        hand.style.transform = 'rotate(-10deg)';
    }

    function rotateHandRight() {
        isHandRotated = true;
        hand.style.transform = 'rotate(5deg)';
    }

    setInterval(function() {
        if (isHandRotated) rotateHandLeft();
        else rotateHandRight();
    }, 400);

    var isAudioPlayed = false;

    function playAudio() {
        isAudioPlayed = true;
        const myAudio = document.getElementById("myAudio");
        myAudio.play();
    }

    document.body.onclick = ()=>{
        if(isAudioPlayed) return ;
        playAudio();
    }
}
/* Http Code */