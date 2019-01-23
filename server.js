const request = require('request');
const express = require('express');
const cheerio = require('cheerio');
const moment = require('moment');
const app = express();
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


var root = 'http://hf-food.austin.utexas.edu/foodpro/';
var month = moment().format('MM');
var day = "";
var year = moment().format('YYYY');


var dining = [];
dining.push(new Hall("01", "Jester City Limits"));
dining.push(new Hall("05", "Jester City Market"));
dining.push(new Hall("26", "Jest A' Pizza"));
dining.push(new Hall("12", "Jester 2nd Floor"));
dining.push(new Hall("03", "Kinsolving"));
dining.push(new Hall("14", "Kin's Market"));
dining.push(new Hall("08", "Cypress Bend"));
dining.push(new Hall("19", "Littlefield"));

function Hall(code, name) {
    this.code = code;
    this.name = name;
    this.meals = {
        "Breakfast": [],
        "Lunch": [],
        "Dinner": []
    }
}
updateFoods();
setInterval(updateFoods, 60 * 1000);

function updateFoods() {
    let newday = moment().format('DD');
    // console.log(newday);
    if (day != newday) {
        day = newday;
        for (hall in dining) {
            // console.log(hall);
            for (meal in dining[hall].meals) {
                getMeals(meal, hall).then((values) => {
                    dining[hall].meals[meal] = values;
                }).catch((err) => {
                    console.log(err);
                });
            }
        }
    }
}


function getMeals(meal, hall) {
    return new Promise(function(resolve, reject) {
        var url = `http://hf-food.austin.utexas.edu/foodpro/pickMenu2.asp?locationNum=12`
        request(url, (err, response, body) => {
            if (!err && response.statusCode == 200) {
                var $ = cheerio.load(body);
                if ($('.pickmenuinstructs').text() == "No Data Available") {
                    console.log("Dining Hall Closed at this time");
                    reject("dining hall closed");
                } else {
                    var foodlinks = $('.pickmenucoldispname>a');
                    var length = foodlinks.length;
                    console.log(`Starting ${dining[hall].name}'s ${meal}`);
                    var promises = [];
                    foodlinks.each(function(i, element) {
                        var food = $(this).text();
                        var link = $(this).attr('href');
                        var tags = [];
                        var parent = $(this).closest('tr').find('td>img').each(function(i, element) {
                            tags[i] = $(this).prop('src').replace('LegendImages/', "").replace('.gif', "");
                        });
                        var promise = getNutrition(root + link, food, meal, tags);
                        promises.push(promise);
                    });
                    Promise.all(promises).then((values) => {
                        console.log(`Finished ${dining[hall].name}'s ${meal}`);
                        dining[hall].meals[meal] = values;
                    }).catch(reason => {
                        console.log(reason);
                        reject(reason);
                    });
                }
            } else {
                console.log(response.statusCode);
                reject(response.statusCode);
            }
        });
    });
}

// function randMeal(meal, calories) {
//     console.log(foodDict[meal].length);
//     var foods = [];
//     var totalCalories = 0;
//     var index = 0;
//     while (totalCalories <= calories) {
//         //  console.log("index: " + index)
//         var food = foodDict[meal][index]
//         //console.log(food);
//         totalCalories += parseInt(food.nutrition.totalCalories);
//         foods.push(food);
//         index++;
//     }
//
//     console.log("calories: " + totalCalories);
// }

function getNutrition(link, food, meal, tags) {
    return new Promise(function(resolve, reject) {
        request(link, (err, response, body) => {
            if (!err && response.statusCode == 200) {
                var $ = cheerio.load(body);
                var sumData = [];
                var fullData = [];
                $('td>font[size="5"]').each(function(i, element) {
                    sumData[i] = $(this).text().replace(/\s/g, '');
                });
                $('td:not([align])>font[size="4"]').each(function(i, element) {
                    fullData[i] = $(this).text().replace(/\s/g, '').replace(/(\d)([^\d\s%\/.])/g, '$1 $2');
                    //  console.log(i + " " + fullData[i]);
                });
                resolve(new Food(food, meal, tags, sumData, fullData));
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
    if (sumData.length && fullData.length) {
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
}


var commandArgs = process.argv.slice(2);
if (commandArgs[0] == "allVeg") {

}
app.get('/:hall/:meal', (req, res) => {
    var meal = req.params.meal;
    var hall = dining.find(function(h) {
        return h.code = req.params.hall;
    });
    if (hall) {
        res.send(hall.meals[meal]);
    } else {
        res.send('Could not find Hall with that code');
    }
    // var promise = getMeals(meal).then((values) => {
    //     console.log(values);
    //     res.send(values);
    // }).catch((reason) => {
    //     res.send(reason);
    // });
});

app.get('/:hall/:meal/veg', (req, res) => {
    var meal = req.params.meal;
    var hall = req.params.hall;
    var hall = dining.find(function(h) {
        return h.code = req.params.hall;
    });
    if (hall) {
        res.send(hall.meals[meal]);
    } else {
        res.send('Could not find Hall with that code');
    }
    res.send(hall.meals[meal].filter(function(food) {
        return food.tags.includes('veggie');
    }));
});


app.get('/', (req, res) => {
    var meal = req.params.meal;
    res.send(dining);
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});