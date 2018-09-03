const request = require('request');
const express = require('express');
const cheerio = require('cheerio');
const app = express();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


getMeals();

function getMeals() {
    var meals = ["Breakfast", "Lunch", "Dinner"];
    for (let m in meals) {
        console.log(meals[m]);
        var url = `http://hf-food.austin.utexas.edu/foodpro/pickMenu2.asp?locationNum=01&locationName=Jester+City+Limits&dtdate=09%2F02%2F2018&mealName=${meals[m]}&sName=The+University+of+Texas+at+Austin+%2D+Housing+and+Dining`
        request(url, (err, response, body) => {
            if (!err && response.statusCode == 200) {
                var $ = cheerio.load(body);
                $('.pickmenucoldispname>a').each(function (i, element) {
                    var a = $(this).text();
                    console.log(a)
                });
                //console.log(body);
            }
        });
    }
}


app.get('/', (req, res) => {

});


// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//     console.log(`Listening on port: ${port}`);
// });