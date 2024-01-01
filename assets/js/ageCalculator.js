/**
 * @author Elias De Hondt
 * @see https://eliasdh.com
 * @since 01/01/2020
 */

var currentDate = new Date();
var currentYear = currentDate.getFullYear();
var birthDate = new Date('2001-04-10');

var age = calculateAge(birthDate, currentDate);
var experience = currentYear - 2020;

document.getElementById("age1").textContent = age;
document.getElementById("age2").textContent = age;
document.getElementById("experience").textContent = experience;

function calculateAge(birthDate, currentDate) {
    var yearsDiff = currentDate.getFullYear() - birthDate.getFullYear();
    var birthMonth = birthDate.getMonth();
    var currentMonth = currentDate.getMonth();

    if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDate.getDate() < birthDate.getDate())) {
      yearsDiff--;
    }
    return yearsDiff;
}