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

var foodDict = {
    "Breakfast": [],
    "Lunch": [],
    "Dinner": []
};

for (meal in foodDict) {
    getMeals(meal);
}


function getMeals(meal) {
    day = "04";
    var url = `http://hf-food.austin.utexas.edu/foodpro/pickMenu2.asp?locationNum=12&locationName=Jester+2nd+Floor+Dining&dtdate=${month}%2F${day}%2F${year}&mealName=${meal}&sName=The+University+of+Texas+at+Austin+%2D+Housing+and+Dining`
    request(url, (err, response, body) => {
        if (!err && response.statusCode == 200) {
            var $ = cheerio.load(body);
            if ($('.pickmenuinstructs').text() == "No Data Available") {
                console.log("Dining Hall Closed at this time");
            } else {
                $('.pickmenucoldispname>a').each(function (i, element) {
                    var food = $(this).text();
                    var link = $(this).attr('href');
                    var tags = [];
                    var parent = $(this).closest('tr').find('td>img').each(function (i, element) {
                        tags[i] = $(this).prop('src').replace('LegendImages/', "").replace('.gif', "");
                    });
                    var promise = getNutrition(root + link);
                    promise.then(function (body) {
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
                        var curfood = new Food(food, meal, tags, sumData, fullData);
                        console.log(curfood);
                        foodDict[meal].push(curfood);
                    }).catch(function (err) {
                        console.log(err);
                    });
                });
            }
        } else {
            console.log(response.statusCode);
        }
    });
}

function getNutrition(link) {
    return new Promise(function (resolve, reject) {
        request(link, (err, response, body) => {
            if (!err && response.statusCode == 200) {
                resolve(body);
            } else {
                reject(err);
            }
        });
    });
}

function Food(food, meal, tags, sumData, fullData) {
    this.food = food;
    this.meal = meal;
    this.tags = tags;
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


var commandArgs = process.argv.slice(2);
if (commandArgs[0] == "allVeg") {

}

app.get('/', (req, res) => {

});


// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//     console.log(`Listening on port: ${port}`);
// });