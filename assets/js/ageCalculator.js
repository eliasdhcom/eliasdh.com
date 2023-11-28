/**
 * @author Elias De Hondt
 * @see https://eliasdh.com
 * @since 01/01/2020
 */

var currentDate = new Date();
var currentYear = currentDate.getFullYear();
var birthYear = 2001;

var age = currentYear - birthYear;
var experience = currentYear - 2020;

document.getElementById("age").textContent = age;
document.getElementById("experience").textContent = experience;