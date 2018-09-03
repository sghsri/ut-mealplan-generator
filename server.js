const request = require('request');
const express = require('express');
const cheerio = require('cheerio');
const moment = require('moment');

const app = express();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var root = 'http://hf-food.austin.utexas.edu/foodpro/';
var month = moment().format('MM');
var day = moment().format('DD');
var year = moment().format('YYYY');
console.log(month + '/' + day + '/' + year);
getMeals();

function getMeals() {
    var meals = ["Breakfast", "Lunch", "Dinner"];
    for (let m in meals) {
        var url = `http://hf-food.austin.utexas.edu/foodpro/pickMenu2.asp?locationNum=01&locationName=Jester+City+Limits&dtdate=${month}%2F${day}%2F${year}&mealName=${meals[m]}&sName=The+University+of+Texas+at+Austin+%2D+Housing+and+Dining`
        request(url, (err, response, body) => {
            if (!err && response.statusCode == 200) {
                var $ = cheerio.load(body);
                $('.pickmenucoldispname>a').each(function (i, element) {
                    var food = $(this).text();
                    var link = $(this).attr('href');
                    meal = meals[m];
                    getNutrition(meal, food, root + link)

                });
            } else {
                console.log(response.statusCode);
            }
        });
    }
}

function getNutrition(meal, food, link) {
    request(link, (err, response, body) => {
        if (!err && response.statusCode == 200) {
            var $ = cheerio.load(body);
            var output = food + ": \n";
            var sumData = [];
            var fullData = [];

            $('td>font[size="5"]').each(function (i, element) {
                sumData[i] = $(this).text().replace(/\s/g, '');
            });
            $('td:not([align])>font[size="4"]').each(function (i, element) {
                fullData[i] = $(this).text().replace(/\s/g, '').replace(/(\d)([^\d\s%\/.])/g, '$1 $2');
                //  console.log(i + " " + fullData[i]);
            });
            var x = new Food(food, meal, sumData, fullData);
            console.log(x);
            // console.log(fullData);
        }
    });
}

function Food(food, meal, sumData, fullData) {
    this.food = food;
    this.meal = meal;
    this.nutrition = {
        servingSize: sumData[1].replace(/(\d)([^\d\s%\/])/g, '$1 $2'),
        totalCalories: sumData[2].replace('Calories', ''),
        calFromFat: sumData[3].replace('CaloriesfromFat', ''),
        totalFat: fullData[1],
        totalCarb: fullData[3],
        satFat: fullData[5],
        dietaryFiber: fullData[7],
        transFat: fullData[9],
        sugars: fullData[11],
        cholesterol: fullData[13],
        protein: fullData[15],
        sodium: fullData[17]
    }
}


app.get('/', (req, res) => {

});


// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//     console.log(`Listening on port: ${port}`);
// });