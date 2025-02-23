/**
    * @author  EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

// Home Page
if (document.getElementById('home')) {
    // Subtitle
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

    // Team
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
            window.location.href = "https://www.linkedin.com/company/eliasdh/jobs/";
        });
    });
}

// Content Loader
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

// Footer
function setJavaScriptFooter() {
    document.getElementById("footer-year").textContent = new Date().getFullYear();
}

// Navigation Bar
function setJavaScriptNavigationBar() {
    if (window.innerWidth < 768) return;

    document.getElementById('navigationbarIcon').addEventListener('click', function() {
        const navigationbarList = document.getElementById('navigationbarList');
        if (navigationbarList.style.visibility === 'visible') {
            navigationbarList.style.visibility = 'hidden';
        } else {
            navigationbarList.style.visibility = 'visible';
        }
    });
}

// Http Code
if (document.getElementById('403')) {
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

// Change to relative paths
const routes = {
    '/': '/index.html',
    '/home': 'home',
    '/about': 'about',
    '/services': 'services',
    '/team': 'team',
    '/privacy-policy': '/assets/pages/privacy-policy.html',
    '/legal-guidelines': '/assets/pages/legal-guidelines.html',
    '/403': '/assets/pages/403.html',
    '/404': '/assets/pages/404.html',
};

function navigateToId(elementId, path) {
    const urlWithParams = new URL(path, window.location.href);
    urlWithParams.searchParams.append('scrollTo', elementId);
    window.location.href = urlWithParams.href;
}

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const elementId = urlParams.get('scrollTo');
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    rewriteCurrentURL(elementId);
};

function loadContent(prettyURL) {
    const actualURL = routes[prettyURL] || null;
    if (actualURL) {
        fetch(actualURL).then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
        })
    }
}

function rewriteCurrentURL(path) {
    const prettyURL = Object.keys(routes).find(key => routes[key] === path);
    if (prettyURL) history.replaceState({}, '', prettyURL);
    loadContent(prettyURL || path);
}

rewriteCurrentURL(window.location.pathname);