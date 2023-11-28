/**
 * @author Elias De Hondt
 * @see https://eliasdh.com
 * @since 01/01/2020
 */

/* Right Click Menu */
function hideMenu() {
    $('#contextMenu').hide();
    sessionStorage.removeItem('select');
}

$( document ).ready(function() {
    
    $( document ).contextmenu(function(e) {
      e.preventDefault();
      localStorage.setItem('select',document.getSelection());

      hideMenu();

      let menu = document.getElementById("contextMenu")
      menu.style.display = 'block';
      menu.style.left = e.pageX + "px";
      menu.style.top = e.pageY + "px";
    });

    $( document ).on('click', hideMenu);
});
/* Right Click Menu */

/* Copy Link Address */
function copylinkaddress() {
  navigator.clipboard.writeText(window.location.href);
}
/* Copy Link Address */

/* Copy To Clipboard */
function copytoclip() {
  navigator.clipboard.writeText(localStorage.getItem('select'));
}
/* Copy To Clipboard */

/* Dark Mode */
(function() {
  let onpageLoad = localStorage.getItem("theme") || "";
  let element = document.body;
  element.classList.add(onpageLoad);
  document.getElementById("theme").textContent = localStorage.getItem("theme") || "light";
})();

function darkmode() {
  let element = document.body;
  element.classList.toggle("dark-mode");

  let theme = localStorage.getItem("theme");
  if (theme && theme === "dark-mode") localStorage.setItem("theme", "");
  else localStorage.setItem("theme", "dark-mode");
  

  document.getElementById("theme").textContent = localStorage.getItem("theme");
}
/* Dark Mode */