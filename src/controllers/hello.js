const moviename = "hello";
const searchText = `${moviename}`;
const patern = new RegExp(searchText, "i");
const matc = "Hellop piuo";
let h = matc.match(patern);
console.log(patern);
console.log(h);
const date = "23/06/2023";
console.log(new Date(date));